// userRoutes.ts
import { Hono } from "hono";
import { decodeJwt } from "jose";
import type { Env } from "./core-utils";
import { UserEntity, ListingEntity, OrderEntity } from "./entities";
import { ok, bad, notFound, isStr } from "./core-utils";
import { hashPassword, verifyPassword } from "./auth-utils";
import type { User, AuthResponse } from "@shared/types";

export interface HonoEnv extends Env {
  WIREDAN_KV: KVNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  APPLE_CLIENT_ID: string;
  APPLE_CLIENT_SECRET: string;
}

export function userRoutes(app: Hono<{ Bindings: HonoEnv }>) {
  // ---------------------------
  // REGISTER
  // ---------------------------
  app.post("/api/auth/register", async (c) => {
    const { name, email, password } = await c.req.json();
    if (!isStr(name) || !isStr(email) || !isStr(password))
      return bad(c, "Name, email, and password required");

    const userEntity = new UserEntity(c.env, email.toLowerCase());
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

    await UserEntity.create(c.env, newUser);
    const { passwordHash, passwordSalt, ...safeUser } = newUser;

    return ok(c, safeUser);
  });

  // ---------------------------
  // EMAIL + PASSWORD LOGIN
  // ---------------------------
  app.post("/api/auth/login", async (c) => {
    const { email, password } = await c.req.json();
    if (!isStr(email) || !isStr(password))
      return bad(c, "Email and password required");

    const userEntity = new UserEntity(c.env, email.toLowerCase());
    if (!(await userEntity.exists())) return bad(c, "Invalid credentials");

    const user = await userEntity.getState();
    if (!user.passwordHash || !user.passwordSalt)
      return bad(c, "Invalid credentials");

    const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!valid) return bad(c, "Invalid credentials");

    const token = crypto.randomUUID();
    await c.env.WIREDAN_KV.put(`session:${token}`, user.id, {
      expirationTtl: 60 * 60 * 24 * 7, // 7 days
    });

    const { passwordHash, passwordSalt, ...safeUser } = user;

    return ok(c, { token, user: safeUser } as AuthResponse);
  });

  // ---------------------------
  // LOGOUT
  // ---------------------------
  app.post("/api/auth/logout", async (c) => {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (token) await c.env.WIREDAN_KV.delete(`session:${token}`);
    return ok(c, { message: "Logged out" });
  });

  // ---------------------------
  // /ME — Validate Session
  // ---------------------------
  app.get("/api/auth/me", async (c) => {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return bad(c, "Unauthorized");

    const userId = await c.env.WIREDAN_KV.get(`session:${token}`);
    if (!userId) return bad(c, "Unauthorized");

    const userEntity = new UserEntity(c.env, userId);
    if (!(await userEntity.exists())) return bad(c, "Unauthorized");

    const user = await userEntity.getState();
    const { passwordHash, passwordSalt, ...safeUser } = user;

    return ok(c, safeUser);
  });

  // ------------------------------------------------------
  // GOOGLE / MICROSOFT / APPLE OAUTH (shared pattern)
  // ------------------------------------------------------

  async function oauthHandler(
    c: any,
    provider: "google" | "microsoft" | "apple",
    tokenUrl: string,
    params: Record<string, string>
  ) {
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });

    const tokenJson = await tokenResponse.json();
    if (!tokenJson.id_token) return bad(c, `${provider} token exchange failed`);

    const profile = decodeJwt(tokenJson.id_token) as { email?: string; name?: string };
    if (!profile.email) return bad(c, `Missing ${provider} account email`);

    const email = profile.email.toLowerCase();
    const name = profile.name || email.split("@")[0];

    const userEntity = new UserEntity(c.env, email);
    let user = await userEntity.getState().catch(() => null);

    if (!user) {
      user = {
        id: email,
        name,
        role: "Farmer",
        kycStatus: "Not Submitted",
        location: "",
        passwordHash: "",
        passwordSalt: "",
      };
      await UserEntity.create(c.env, user);
    }

    const token = crypto.randomUUID();
    await c.env.WIREDAN_KV.put(`session:${token}`, email, {
      expirationTtl: 60 * 60 * 24 * 7,
    });

    const { passwordHash, passwordSalt, ...safeUser } = user;
    return ok(c, { token, user: safeUser } as AuthResponse);
  }

  // GOOGLE
  app.get("/api/auth/google/callback", (c) =>
    oauthHandler(c, "google", "https://oauth2.googleapis.com/token", {
      code: c.req.query("code")!,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "https://wiredan.com/api/auth/google/callback",
      grant_type: "authorization_code",
    })
  );

  // MICROSOFT
  app.get("/api/auth/microsoft/callback", (c) =>
    oauthHandler(c, "microsoft", "https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      code: c.req.query("code")!,
      client_id: c.env.MICROSOFT_CLIENT_ID,
      client_secret: c.env.MICROSOFT_CLIENT_SECRET,
      redirect_uri: "https://wiredan.com/api/auth/microsoft/callback",
      grant_type: "authorization_code",
    })
  );

  // APPLE
  app.post("/api/auth/apple/callback", async (c) => {
    const body = await c.req.parseBody();
    const code = body["code"];
    if (!code) return bad(c, "Missing authorization code");

    return oauthHandler(c, "apple", "https://appleid.apple.com/auth/token", {
      code,
      client_id: c.env.APPLE_CLIENT_ID,
      client_secret: c.env.APPLE_CLIENT_SECRET,
      grant_type: "authorization_code",
      redirect_uri: "https://wiredan.com/api/auth/apple/callback",
    });
  });
}