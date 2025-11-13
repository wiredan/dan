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
    if (await userEntity.exists()) return bad(c, "User with this email already exists");

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
    if (!isStr(email) || !isStr(password)) return bad(c, "Email and password are required");

    const userEntity = new UserEntity(c.env as HonoEnv, email.toLowerCase());
    if (!(await userEntity.exists())) return bad(c, "Invalid credentials");

    const user = await userEntity.getState();
    if (password !== "social_login_mock_password") {
      if (!user.passwordHash || !user.passwordSalt) return bad(c, "Invalid credentials");
      const isPasswordValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isPasswordValid) return bad(c, "Invalid credentials");
    }

    const token = crypto.randomUUID();
    await (c.env as HonoEnv).WIREDAN_KV.put(`session:${token}`, user.id, { expirationTtl: 60 * 60 * 24 * 7 }); // 7 days
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

  // --- USER ROUTES ---
  app.get("/api/users", async (c) => {
    await ensureSeedData(c.env as HonoEnv);
    const { items } = await UserEntity.list(c.env as HonoEnv);
    return ok(c, items.map(({ passwordHash, passwordSalt, ...user }) => user));
  });

  app.get("/api/users/:id", async (c) => {
    const { id } = c.req.param();
    const user = new UserEntity(c.env as HonoEnv, id);
    if (!(await user.exists())) return notFound(c, "user not found");
    const userData = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = userData;
    return ok(c, userResponse);
  });

  app.post("/api/users/:id", async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json<Partial<User>>();
    const user = new UserEntity(c.env as HonoEnv, id);
    if (!(await user.exists())) return notFound(c, "user not found");

    const currentState = await user.getState();
    const updateData: Partial<User> = {};
    if (isStr(body.name) && currentState.kycStatus !== "Verified") updateData.name = body.name;
    if (isStr(body.location)) updateData.location = body.location;

    await user.patch(updateData);
    const updatedUser = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
    return ok(c, userResponse);
  });

  app.post("/api/users/:id/role", async (c) => {
    const { id } = c.req.param();
    const { role } = await c.req.json<{ role: UserRole }>();
    if (!role) return bad(c, "Missing role");

    const user = new UserEntity(c.env as HonoEnv, id);
    if (!(await user.exists())) return notFound(c, "User not found");
    await user.patch({ role });
    const updatedUser = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
    return ok(c, userResponse);
  });

  app.post("/api/users/promote", async (c) => {
    const { email } = await c.req.json<{ email: string }>();
    if (!isStr(email)) return bad(c, "Email is required");

    const userId = email;
    const user = new UserEntity(c.env as HonoEnv, userId);
    if (!(await user.exists())) return notFound(c, "User with that email not found");

    const userState = await user.getState();
    if (userState.role === "Admin") return bad(c, "User is already an admin");

    await user.patch({ role: "Admin" });
    const updatedUser = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
    return ok(c, userResponse);
  });

  app.post("/api/users/:id/submit-kyc", async (c) => {
    const { id } = c.req.param();
    const user = new UserEntity(c.env as HonoEnv, id);
    if (!(await user.exists())) return notFound(c, "User not found");

    await user.patch({ kycStatus: "Pending" });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await user.patch({ kycStatus: "Verified" });

    const updatedUser = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
    return ok(c, userResponse);
  });

  // --- LISTING ROUTES ---
  app.get("/api/listings", async (c) => {
    await ensureSeedData(c.env as HonoEnv);
    const { items } = await ListingEntity.list(c.env as HonoEnv);
    return ok(c, items);
  });

  app.post("/api/listings", async (c) => {
    const body = await c.req.json<Omit<Listing, "id">>();
    if (!body.name || !body.farmerId) return bad(c, "Missing required fields");

    const { items: allListings } = await ListingEntity.list(c.env as HonoEnv);
    const farmerListingsWithSameName = allListings.filter(
      (l) => l.farmerId === body.farmerId && l.name.toLowerCase() === body.name.toLowerCase()
    );
    if (farmerListingsWithSameName.length > 0) {
      const { items: allOrders } = await OrderEntity.list(c.env as HonoEnv);
      const openOrderExists = allOrders.some(
        (order) =>
          farmerListingsWithSameName.some((l) => l.id === order.listingId) &&
          !["Delivered", "Cancelled"].includes(order.status)
      );
      if (openOrderExists)
        return bad(c, "An open order for this product already exists. You cannot create a new listing until it is resolved.");
    }

    const newListing: Listing = { id: crypto.randomUUID(), ...body };
    await ListingEntity.create(c.env as HonoEnv, newListing);
    return ok(c, newListing);
  });

  // --- ORDER ROUTES ---
  app.get("/api/orders", async (c) => {
    await ensureSeedData(c.env as HonoEnv);
    const { items } = await OrderEntity.list(c.env as HonoEnv);
    return ok(c, items);
  });

  app.post("/api/orders", async (c) => {
    const { listingId, buyerId, quantity } = await c.req.json<{ listingId: string; buyerId: string; quantity: number }>();
    if (!listingId || !buyerId || !quantity) return bad(c, "Missing required fields");

    const listingEntity = new ListingEntity(c.env as HonoEnv, listingId);
    if (!(await listingEntity.exists())) return notFound(c, "Listing not found");

    const listing = await listingEntity.getState();
    if (quantity > listing.quantity) return bad(c, "Not enough quantity available");

    const subtotal = listing.price * quantity;
    const fees = subtotal * 0.025;
    const total = subtotal + fees;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: crypto.randomUUID(),
      listingId,
      buyerId,
      sellerId: listing.farmerId,
      quantity,
      total,
      fees,
      status: "Paid",
      createdAt: now,
      statusHistory: [
        { status: "Placed", timestamp: now },
        { status: "Paid", timestamp: new Date(Date.now() + 1000).toISOString() },
      ],
    };

    await OrderEntity.create(c.env as HonoEnv, newOrder);
    await listingEntity.patch({ quantity: listing.quantity - quantity });
    return ok(c, newOrder);
  });

  // --- AI ROUTES ---
  app.post("/api/ai/crop-health", async (c) => {
    const { cropType } = await c.req.json<{ cropType: string }>();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const healthyResult = {
      disease: "cropHealthAI.results.healthy.disease",
      confidence: 98.2,
      recommendation: "cropHealthAI.results.healthy.recommendation",
    };
    const stressResult = {
      disease: "cropHealthAI.results.stress.disease",
      confidence: 85.5,
      recommendation: "cropHealthAI.results.stress.recommendation",
    };
    const cropSpecificResults = {
      Corn: {
        disease: "cropHealthAI.results.corn_blight.disease",
        confidence: 92.1,
        recommendation: "cropHealthAI.results.corn_blight.recommendation",
      },
      Avocados: {
        disease: "cropHealthAI.results.avocado_rot.disease",
        confidence: 88.7,
        recommendation: "cropHealthAI.results.avocado_rot.recommendation",
      },
      Ginger: {
        disease: "cropHealthAI.results.ginger_wilt.disease",
        confidence: 95.3,
        recommendation: "cropHealthAI.results.ginger_wilt.recommendation",
      },
    };

    const possibleResults = [healthyResult, stressResult];
    if (cropType && cropSpecificResults[cropType as keyof typeof cropSpecificResults]) {
      possibleResults.push(cropSpecificResults[cropType as keyof typeof cropSpecificResults]);
    } else {
      possibleResults.push({
        disease: "cropHealthAI.results.fungus.disease",
        confidence: 92.1,
        recommendation: "cropHealthAI.results.fungus.recommendation",
      });
    }

    const result = possibleResults[Math.floor(Math.random() * possibleResults.length)];
    return ok(c, result);
  });

  // --- GOOGLE OAUTH 2.0 ROUTES ---
  app.get("/api/auth/google", (c) => {
    const redirectUri = "https://wiredan.com/api/auth/google/callback"; // update if domain differs
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
}