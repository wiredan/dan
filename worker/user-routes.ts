import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ListingEntity, OrderEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Listing, Order, User, OrderStatus, UserRole, AuthResponse } from "@shared/types";
import { hashPassword, verifyPassword } from './auth-utils';
// KV Namespace binding is now WIREDAN_KV
export interface HonoEnv extends Env {
  WIREDAN_KV: KVNamespace;
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  const ensureSeedData = async (env: HonoEnv) => {
    await UserEntity.ensureSeed(env);
    await ListingEntity.ensureSeed(env);
    await OrderEntity.ensureSeed(env);
  };
  // AUTH ROUTES
  app.post('/api/auth/register', async (c) => {
    const { name, email, password } = await c.req.json<{ name?: string; email?: string; password?: string }>();
    if (!isStr(name) || !isStr(email) || !isStr(password)) return bad(c, 'Name, email, and password are required');
    const userEntity = new UserEntity(c.env as HonoEnv, email.toLowerCase());
    if (await userEntity.exists()) return bad(c, 'User with this email already exists');
    const { hash, salt } = await hashPassword(password);
    const newUser: User = {
      id: email.toLowerCase(),
      name,
      role: 'Farmer',
      kycStatus: 'Not Submitted',
      location: '',
      passwordHash: hash,
      passwordSalt: salt,
    };
    await UserEntity.create(c.env as HonoEnv, newUser);
    const { passwordHash, passwordSalt, ...userResponse } = newUser;
    return ok(c, userResponse);
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>();
    if (!isStr(email) || !isStr(password)) return bad(c, 'Email and password are required');
    const userEntity = new UserEntity(c.env as HonoEnv, email.toLowerCase());
    if (!(await userEntity.exists())) return bad(c, 'Invalid credentials');
    const user = await userEntity.getState();
    // Handle social login simulation
    if (password !== 'social_login_mock_password') {
      if (!user.passwordHash || !user.passwordSalt) return bad(c, 'Invalid credentials');
      const isPasswordValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isPasswordValid) return bad(c, 'Invalid credentials');
    }
    const token = crypto.randomUUID();
    await (c.env as HonoEnv).WIREDAN_KV.put(`session:${token}`, user.id, { expirationTtl: 60 * 60 * 24 * 7 }); // 7 days
    const { passwordHash, passwordSalt, ...userResponse } = user;
    return ok(c, { token, user: userResponse } as AuthResponse);
  });
  app.post('/api/auth/logout', async (c) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    if (token) {
      await (c.env as HonoEnv).WIREDAN_KV.delete(`session:${token}`);
    }
    return ok(c, { message: 'Logged out' });
  });
  app.get('/api/auth/me', async (c) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const userId = await (c.env as HonoEnv).WIREDAN_KV.get(`session:${token}`);
    if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const userEntity = new UserEntity(c.env as HonoEnv, userId);
    if (!(await userEntity.exists())) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const user = await userEntity.getState();
    const { passwordHash, passwordSalt, ...userResponse } = user;
    return ok(c, userResponse);
  });
  // USER ROUTES
  app.get('/api/users', async (c) => {
    await ensureSeedData(c.env as HonoEnv);
    const { items } = await UserEntity.list(c.env as HonoEnv);
    return ok(c, items.map(({ passwordHash, passwordSalt, ...user }) => user));
  });
  app.get('/api/users/:id', async (c) => {
    const { id } = c.req.param();
    const user = new UserEntity(c.env as HonoEnv, id);
    if (!(await user.exists())) return notFound(c, 'user not found');
    const userData = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = userData;
    return ok(c, userResponse);
  });
  app.post('/api/users/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json<Partial<User>>();
    const user = new UserEntity(c.env as HonoEnv, id);
    if (!(await user.exists())) return notFound(c, 'user not found');
    const currentState = await user.getState();
    const updateData: Partial<User> = {};
    if (isStr(body.name) && currentState.kycStatus !== 'Verified') {
      updateData.name = body.name;
    }
    if (isStr(body.location)) updateData.location = body.location;
    await user.patch(updateData);
    const updatedUser = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
    return ok(c, userResponse);
  });
  app.post('/api/users/:id/role', async (c) => {
    const { id } = c.req.param();
    const { role } = await c.req.json<{ role: UserRole }>();
    if (!role) return bad(c, 'Missing role');
    const user = new UserEntity(c.env as HonoEnv, id);
    if (!(await user.exists())) return notFound(c, 'User not found');
    await user.patch({ role });
    const updatedUser = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
    return ok(c, userResponse);
  });
  app.post('/api/users/promote', async (c) => {
    const { email } = await c.req.json<{ email: string }>();
    if (!isStr(email)) return bad(c, 'Email is required');
    const userId = email;
    const user = new UserEntity(c.env as HonoEnv, userId);
    if (!(await user.exists())) {
      return notFound(c, 'User with that email not found');
    }
    const userState = await user.getState();
    if (userState.role === 'Admin') {
      return bad(c, 'User is already an admin');
    }
    await user.patch({ role: 'Admin' });
    const updatedUser = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
    return ok(c, userResponse);
  });
  app.post('/api/users/:id/submit-kyc', async (c) => {
    const { id } = c.req.param();
    const user = new UserEntity(c.env as HonoEnv, id);
    if (!(await user.exists())) return notFound(c, 'User not found');
    await user.patch({ kycStatus: 'Pending' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await user.patch({ kycStatus: 'Verified' });
    const updatedUser = await user.getState();
    const { passwordHash, passwordSalt, ...userResponse } = updatedUser;
    return ok(c, userResponse);
  });
  // LISTING ROUTES
  app.get('/api/listings', async (c) => {
    await ensureSeedData(c.env as HonoEnv);
    const { items } = await ListingEntity.list(c.env as HonoEnv);
    return ok(c, items);
  });
  app.get('/api/listings/:id', async (c) => {
    const { id } = c.req.param();
    const listing = new ListingEntity(c.env as HonoEnv, id);
    if (!(await listing.exists())) return notFound(c, 'listing not found');
    return ok(c, await listing.getState());
  });
  app.post('/api/listings', async (c) => {
    const body = await c.req.json<Omit<Listing, 'id'>>();
    if (!body.name || !body.farmerId) return bad(c, 'Missing required fields');
    const { items: allListings } = await ListingEntity.list(c.env as HonoEnv);
    const farmerListingsWithSameName = allListings.filter(
      l => l.farmerId === body.farmerId && l.name.toLowerCase() === body.name.toLowerCase()
    );
    if (farmerListingsWithSameName.length > 0) {
      const { items: allOrders } = await OrderEntity.list(c.env as HonoEnv);
      const openOrderExists = allOrders.some(order =>
        farmerListingsWithSameName.some(l => l.id === order.listingId) &&
        !['Delivered', 'Cancelled'].includes(order.status)
      );
      if (openOrderExists) {
        return bad(c, 'An open order for this product already exists. You cannot create a new listing until it is resolved.');
      }
    }
    const newListing: Listing = {
      id: crypto.randomUUID(),
      ...body
    };
    await ListingEntity.create(c.env as HonoEnv, newListing);
    return ok(c, newListing);
  });
  // ORDER ROUTES
  app.get('/api/orders', async (c) => {
    await ensureSeedData(c.env as HonoEnv);
    const { items } = await OrderEntity.list(c.env as HonoEnv);
    return ok(c, items);
  });
  app.get('/api/orders/:id', async (c) => {
    const { id } = c.req.param();
    const order = new OrderEntity(c.env as HonoEnv, id);
    if (!(await order.exists())) return notFound(c, 'order not found');
    return ok(c, await order.getState());
  });
  app.post('/api/orders', async (c) => {
    const { listingId, buyerId, quantity } = await c.req.json<{ listingId: string; buyerId: string; quantity: number }>();
    if (!listingId || !buyerId || !quantity) return bad(c, 'Missing required fields');
    const listingEntity = new ListingEntity(c.env as HonoEnv, listingId);
    if (!(await listingEntity.exists())) return notFound(c, 'Listing not found');
    const listing = await listingEntity.getState();
    if (quantity > listing.quantity) return bad(c, 'Not enough quantity available');
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
      status: 'Paid',
      createdAt: now,
      statusHistory: [
        { status: 'Placed', timestamp: now },
        { status: 'Paid', timestamp: new Date(Date.now() + 1000).toISOString() }
      ],
    };
    await OrderEntity.create(c.env as HonoEnv, newOrder);
    await listingEntity.patch({ quantity: listing.quantity - quantity });
    return ok(c, newOrder);
  });
  const updateOrderStatus = async (order: OrderEntity, status: OrderStatus, details?: Partial<Order>) => {
    return order.mutate(s => ({
      ...s,
      ...details,
      status,
      statusHistory: [...s.statusHistory, { status, timestamp: new Date().toISOString() }]
    }));
  };
  app.post('/api/orders/:id/status', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json<{ status: OrderStatus }>();
    if (!status) return bad(c, 'Missing status');
    const order = new OrderEntity(c.env as HonoEnv, id);
    if (!(await order.exists())) return notFound(c, 'Order not found');
    const updatedOrder = await updateOrderStatus(order, status);
    return ok(c, updatedOrder);
  });
  app.post('/api/orders/:id/dispute', async (c) => {
    const { id } = c.req.param();
    const { reason, evidenceUrl } = await c.req.json<{ reason: string; evidenceUrl: string }>();
    if (!reason) return bad(c, 'Dispute reason is required');
    const order = new OrderEntity(c.env as HonoEnv, id);
    if (!(await order.exists())) return notFound(c, 'Order not found');
    const updatedOrder = await updateOrderStatus(order, 'Disputed', { disputeReason: reason, disputeEvidenceUrl: evidenceUrl });
    return ok(c, updatedOrder);
  });
  app.post('/api/orders/:id/resolve', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json<{ status: 'Delivered' | 'Cancelled' }>();
    if (!status || !['Delivered', 'Cancelled'].includes(status)) return bad(c, 'Invalid resolution status');
    const order = new OrderEntity(c.env as HonoEnv, id);
    if (!(await order.exists())) return notFound(c, 'Order not found');
    const updatedOrder = await updateOrderStatus(order, status);
    return ok(c, updatedOrder);
  });
  app.post('/api/orders/:id/ai-dispute-analysis', async (c) => {
    const { id } = c.req.param();
    const orderEntity = new OrderEntity(c.env as HonoEnv, id);
    if (!(await orderEntity.exists())) return notFound(c, 'Order not found');
    const order = await orderEntity.getState();
    await new Promise(resolve => setTimeout(resolve, 1500));
    let recommendation = "AI analysis inconclusive. Manual review required.";
    if (order.disputeReason?.toLowerCase().includes("moldy") && order.disputeEvidenceUrl) {
      recommendation = "AI recommends a full refund to the buyer. The provided image evidence clearly shows product quality issues (mold) that violate the Grade A listing description.";
    } else if (order.disputeReason?.toLowerCase().includes("not delivered")) {
      recommendation = "AI recommends checking logistics partner data. If delivery cannot be confirmed within 48 hours, a full refund to the buyer is advised.";
    }
    return ok(c, { recommendation });
  });
  // AI ROUTES
  app.post('/api/dan/message', async (c) => {
    const { message } = await c.req.json<{ message?: string }>();
    if (!isStr(message)) return bad(c, 'Message is required');
    const lowerCaseMessage = message.toLowerCase();
    const responses = {
      marketAnalysis: `Based on current data, the global market for Nigerian Ginger is showing a strong upward trend, with prices increasing by approximately 5% over the last quarter due to increased demand from European markets. Avocados remain stable, but a projected surplus from South America may cause a slight price dip in the coming months. For a detailed analysis, I recommend comparing the historical price charts available in the Education Hub.`,
      logistics: `For shipping from West Africa to Asia, we recommend a combination of sea and air freight for optimal cost and speed. Our logistics partners can provide refrigerated containers for perishable goods like avocados. The typical transit time for sea freight to Ho Chi Minh City is 25-30 days. All customs documentation is handled automatically through the platform when you place an order with a logistics partner.`,
      sustainableFarming: `Sustainable farming practices are crucial for long-term profitability. Key techniques include crop rotation to replenish soil nutrients, integrated pest management (IPM) to reduce reliance on chemical pesticides, and conservation tillage to prevent soil erosion. For example, planting legumes like soybeans after a corn harvest can naturally fix nitrogen in the soil, reducing the need for artificial fertilizers. Our Education Hub has several articles detailing these methods.`,
      defi: `Decentralized Finance (DeFi) on our platform allows farmers to tokenize their future harvests to secure upfront capital. This process, known as "agri-tokenization," provides liquidity without relying on traditional banks. Investors can purchase these tokens, representing a share of the future crop, creating a new, accessible asset class. All transactions are secured by smart contracts, which automatically handle payments upon fulfillment of contract terms, such as confirmed delivery.`,
      greeting: `Hello! I am DAN's advanced AI assistant. How can I help you today with market analysis, logistics, sustainable farming, or DeFi concepts?`,
      default: `I can provide detailed information on market trends, logistics optimization, sustainable farming practices, and how Decentralized Finance is integrated into our platform. Please ask me a specific question about one of these topics.`
    };
    let reply = responses.default;
    if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
      reply = responses.greeting;
    } else if (lowerCaseMessage.includes('price') || lowerCaseMessage.includes('market') || lowerCaseMessage.includes('trend') || lowerCaseMessage.includes('analysis')) {
      reply = responses.marketAnalysis;
    } else if (lowerCaseMessage.includes('shipping') || lowerCaseMessage.includes('logistics') || lowerCaseMessage.includes('transport') || lowerCaseMessage.includes('delivery')) {
      reply = responses.logistics;
    } else if (lowerCaseMessage.includes('sustainable') || lowerCaseMessage.includes('farming') || lowerCaseMessage.includes('crop rotation') || lowerCaseMessage.includes('environment')) {
      reply = responses.sustainableFarming;
    } else if (lowerCaseMessage.includes('defi') || lowerCaseMessage.includes('token') || lowerCaseMessage.includes('blockchain') || lowerCaseMessage.includes('finance')) {
      reply = responses.defi;
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
    return ok(c, { reply });
  });
  app.post('/api/ai/crop-health', async (c) => {
    const { cropType } = await c.req.json<{ cropType: string }>();
    await new Promise(resolve => setTimeout(resolve, 2500));
    const healthyResult = { disease: 'cropHealthAI.results.healthy.disease', confidence: 98.2, recommendation: 'cropHealthAI.results.healthy.recommendation' };
    const stressResult = { disease: 'cropHealthAI.results.stress.disease', confidence: 85.5, recommendation: 'cropHealthAI.results.stress.recommendation' };
    const cropSpecificResults = {
      'Corn': { disease: 'cropHealthAI.results.corn_blight.disease', confidence: 92.1, recommendation: 'cropHealthAI.results.corn_blight.recommendation' },
      'Avocados': { disease: 'cropHealthAI.results.avocado_rot.disease', confidence: 88.7, recommendation: 'cropHealthAI.results.avocado_rot.recommendation' },
      'Ginger': { disease: 'cropHealthAI.results.ginger_wilt.disease', confidence: 95.3, recommendation: 'cropHealthAI.results.ginger_wilt.recommendation' },
    };
    const possibleResults = [healthyResult, stressResult];
    if (cropType && cropSpecificResults[cropType as keyof typeof cropSpecificResults]) {
      possibleResults.push(cropSpecificResults[cropType as keyof typeof cropSpecificResults]);
    } else {
      possibleResults.push({ disease: 'cropHealthAI.results.fungus.disease', confidence: 92.1, recommendation: 'cropHealthAI.results.fungus.recommendation' });
    }
    const result = possibleResults[Math.floor(Math.random() * possibleResults.length)];
    return ok(c, result);
  });
}