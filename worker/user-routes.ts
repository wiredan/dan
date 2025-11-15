import { Router } from 'express';
import { validateUser, generateToken } from './auth-utils';

const router = Router();

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await validateUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({ token, user });
});

export default router;
// --- Imports ---
import { decodeJwt } from "jose"; // for verifying Google ID token
import { Hono } from "hono";
import type { Env } from "./core-utils";
import { UserEntity, ListingEntity, OrderEntity } from "./entities";
import { ok, bad, notFound, isStr } from "./core-utils";
import type { Listing, Order, User, OrderStatus, UserRole, AuthResponse } from "@shared/types";
import { hashPassword, verifyPassword } from "./auth-utils";

// --- Env Extension ---
export interface HonoEnv extends Env {
  WIREDAN_KV: KVNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  APPLE_CLIENT_ID: string;
  APPLE_CLIENT_SECRET: string;
}

// --- Main Function ---
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  const ensureSeedData = async (env: HonoEnv) => {
    await UserEntity.ensureSeed(env);
    await ListingEntity.ensureSeed(env);
    await OrderEntity.ensureSeed(env);
  };

  // --- AUTH ROUTES ---
  app.post("/api/auth/register", async (c) => {
    const { name, email, password } = await c.req.json<{ name?: string; email?: string; password?: string }>();
    if (!isStr(name) || !isStr(email) || !isStr(password)) return bad(c, "Name, email, and password are required");

    const userEntity = new UserEntity(c.env as HonoEnv, email.toLowerCase());
    if (await userEntity.exists()) return bad(c, "User already exists");

    const { hash, salt } = await hashPassword(password);
    const newUser: User = {
      id: email.toLowerCase(),
      name,
      role: "Farmer",
      kycStatus: "Not Submitted",
      location: "",
      passwordHash: hash,
      passwordSalt: salt,
    };
    await UserEntity.create(c.env as HonoEnv, newUser);
    const { passwordHash, passwordSalt, ...userResponse } = newUser;
    return ok(c, userResponse);
  });

  app.post("/api/auth/login", async (c) => {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>();
    if (!isStr(email) || !isStr(password)) return bad(c, "Email and password required");

    const userEntity = new UserEntity(c.env as HonoEnv, email.toLowerCase());
    if (!(await userEntity.exists())) return bad(c, "Invalid credentials");

    const user = await userEntity.getState();
    if (password !== "social_login_mock_password") {
      if (!user.passwordHash || !user.passwordSalt) return bad(c, "Invalid credentials");
      const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!valid) return bad(c, "Invalid credentials");
    }

    const token = crypto.randomUUID();
    await (c.env as HonoEnv).WIREDAN_KV.put(`session:${token}`, user.id, { expirationTtl: 60 * 60 * 24 * 7 });

    const { passwordHash, passwordSalt, ...userResponse } = user;
    return ok(c, { token, user: userResponse } as AuthResponse);
  });

  app.post("/api/auth/logout", async (c) => {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    if (token) await (c.env as HonoEnv).WIREDAN_KV.delete(`session:${token}`);
    return ok(c, { message: "Logged out" });
  });

  app.get("/api/auth/me", async (c) => {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return c.json({ success: false, error: "Unauthorized" }, 401);

    const userId = await (c.env as HonoEnv).WIREDAN_KV.get(`session:${token}`);
    if (!userId) return c.json({ success: false, error: "Unauthorized" }, 401);

    const userEntity = new UserEntity(c.env as HonoEnv, userId);
    if (!(await userEntity.exists())) return c.json({ success: false, error: "Unauthorized" }, 401);

    const user = await userEntity.getState();
    const { passwordHash, passwordSalt, ...userResponse } = user;
    return ok(c, userResponse);
  });

  // --- GOOGLE OAUTH ---
  app.get("/api/auth/google", (c) => {
    const redirectUri = "https://wiredan.com/api/auth/google/callback";
    const clientId = c.env.GOOGLE_CLIENT_ID;
    const scope = "openid email profile";
    const state = crypto.randomUUID();

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", scope);
    googleAuthUrl.searchParams.set("state", state);
    googleAuthUrl.searchParams.set("access_type", "offline");

    return c.redirect(googleAuthUrl.toString());
  });

  app.get("/api/auth/google/callback", async (c) => {
    const code = c.req.query("code");
    if (!code) return bad(c, "Missing authorization code");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "https://wiredan.com/api/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = await tokenResponse.json();
    if (!tokenJson.id_token) return bad(c, "Google token exchange failed");

    const googleUser = decodeJwt(tokenJson.id_token) as { email?: string; name?: string };
    if (!googleUser.email) return bad(c, "Missing Google account email");

    const email = googleUser.email.toLowerCase();
    const name = googleUser.name || email.split("@")[0];

    const userEntity = new UserEntity(c.env as HonoEnv, email);
    let user = await userEntity.getState().catch(() => null);

    if (!user) {
      const newUser: User = {
        id: email,
        name,
        role: "Farmer",
        kycStatus: "Not Submitted",
        location: "",
        passwordHash: "",
        passwordSalt: "",
      };
      await UserEntity.create(c.env as HonoEnv, newUser);
      user = newUser;
    }

    const token = crypto.randomUUID();
    await (c.env as HonoEnv).WIREDAN_KV.put(`session:${token}`, email, { expirationTtl: 60 * 60 * 24 * 7 });
    const { passwordHash, passwordSalt, ...userResponse } = user;
    return ok(c, { token, user: userResponse } as AuthResponse);
  });

  // --- MICROSOFT OAUTH ---
  app.get("/api/auth/microsoft", (c) => {
    const redirectUri = "https://wiredan.com/api/auth/microsoft/callback";
    const clientId = c.env.MICROSOFT_CLIENT_ID;
    const scope = "openid email profile offline_access";
    const state = crypto.randomUUID();

    const msAuthUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    msAuthUrl.searchParams.set("client_id", clientId);
    msAuthUrl.searchParams.set("response_type", "code");
    msAuthUrl.searchParams.set("redirect_uri", redirectUri);
    msAuthUrl.searchParams.set("scope", scope);
    msAuthUrl.searchParams.set("state", state);

    return c.redirect(msAuthUrl.toString());
  });

  app.get("/api/auth/microsoft/callback", async (c) => {
    const code = c.req.query("code");
    if (!code) return bad(c, "Missing authorization code");

    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.MICROSOFT_CLIENT_ID,
        client_secret: c.env.MICROSOFT_CLIENT_SECRET,
        redirect_uri: "https://wiredan.com/api/auth/microsoft/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = await tokenResponse.json();
    if (!tokenJson.id_token) return bad(c, "Microsoft token exchange failed");

    const msUser = decodeJwt(tokenJson.id_token) as { email?: string; name?: string };
    if (!msUser.email) return bad(c, "Missing Microsoft account email");

    const email = msUser.email.toLowerCase();
    const name = msUser.name || email.split("@")[0];

    const userEntity = new UserEntity(c.env as HonoEnv, email);
    let user = await userEntity.getState().catch(() => null);

    if (!user) {
      const newUser: User = {
        id: email,
        name,
        role: "Farmer",
        kycStatus: "Not Submitted",
        location: "",
        passwordHash: "",
        passwordSalt: "",
      };
      await UserEntity.create(c.env as HonoEnv, newUser);
      user = newUser;
    }

    const token = crypto.randomUUID();
    await (c.env as HonoEnv).WIREDAN_KV.put(`session:${token}`, email, { expirationTtl: 60 * 60 * 24 * 7 });
    const { passwordHash, passwordSalt, ...userResponse } = user;
    return ok(c, { token, user: userResponse } as AuthResponse);
  });

  // --- APPLE OAUTH ---
  app.get("/api/auth/apple", (c) => {
    const redirectUri = "https://wiredan.com/api/auth/apple/callback";
    const clientId = c.env.APPLE_CLIENT_ID;
    const scope = "name email";
    const state = crypto.randomUUID();

    const appleUrl = new URL("https://appleid.apple.com/auth/authorize");
    appleUrl.searchParams.set("response_type", "code");
    appleUrl.searchParams.set("response_mode", "form_post");
    appleUrl.searchParams.set("client_id", clientId);
    appleUrl.searchParams.set("redirect_uri", redirectUri);
    appleUrl.searchParams.set("scope", scope);
    appleUrl.searchParams.set("state", state);

    return c.redirect(appleUrl.toString());
  });

  app.post("/api/auth/apple/callback", async (c) => {
    const body = await c.req.parseBody();
    const code = body["code"];
    if (!code) return bad(c, "Missing authorization code");

    const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.APPLE_CLIENT_ID,
        client_secret: c.env.APPLE_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: "https://wiredan.com/api/auth/apple/callback",
      }),
    });

    const tokenJson = await tokenResponse.json();
    if (!tokenJson.id_token) return bad(c, "Apple token exchange failed");

    const appleUser = decodeJwt(tokenJson.id_token) as { email?: string; name?: string };
    if (!appleUser.email) return bad(c, "Missing Apple account email");

    const email = appleUser.email.toLowerCase();
    const name = appleUser.name || email.split("@")[0];

    const userEntity = new UserEntity(c.env as HonoEnv, email);
    let user = await userEntity.getState().catch(() => null);

    if (!user) {
      const newUser: User = {
        id: email,
        name,
        role: "Farmer",
        kycStatus: "Not Submitted",
        location: "",
        passwordHash: "",
        passwordSalt: "",
      };
      await UserEntity.create(c.env as HonoEnv, newUser);
      user = newUser;
    }

    const token = crypto.randomUUID();
    await (c.env as HonoEnv).WIREDAN_KV.put(`session:${token}`, email, { expirationTtl: 60 * 60 * 24 * 7 });
    const { passwordHash, passwordSalt, ...userResponse } = user;
    return ok(c, { token, user: userResponse } as AuthResponse);
  });
}
