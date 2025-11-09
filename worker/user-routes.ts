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
  app.get('/api/dan/message', async (c) => {
    const message = c.req.query('message');
    if (!message) return bad(c, 'Message is required');

    const lowerCaseMessage = message.toLowerCase();

    const crops = [
      { name: 'avocados', price: 2.50, unit: 'kg', trend: 'stable' },
      { name: 'ginger', price: 4.00, unit: 'kg', trend: 'rising' },
      { name: 'corn', price: 0.20, unit: 'kg', trend: 'stable' },
      { name: 'soybeans', price: 0.50, unit: 'kg', trend: 'falling' },
    ];

    const responses = {
      greeting: [
        "Hello! How can I assist you with agribusiness today?",
        "Welcome to the Decentralized Agribusiness Network. What can I help you with?",
      ],
      finance: [
        () => {
          const crop1 = crops[Math.floor(Math.random() * crops.length)];
          const crop2 = crops.filter(c => c.name !== crop1.name)[Math.floor(Math.random() * (crops.length - 1))];
          return `Market update: ${crop1.name} prices are currently ${crop1.trend} at around $${crop1.price.toFixed(2)}/${crop1.unit}. Meanwhile, ${crop2.name} prices are ${crop2.trend}.`;
        },
        "Our secure escrow system holds your payment until you confirm delivery. Funds are then automatically released to the farmer, minus a 2.5% platform fee. This protects both buyers and sellers.",
        "You can add payment methods in your profile. We support various options including credit cards and crypto tokens like USDT and our native DAN token.",
      ],
      logistics: [
        "For shipments to Europe, we recommend using our refrigerated container service. The average transit time from Nigeria to the Port of Rotterdam is approximately 18-22 days.",
        "Our logistics partners provide real-time tracking. You can view the status of your shipment on the order tracking page.",
        "We handle all customs documentation for international shipments to ensure a smooth process.",
      ],
      default: [
        "I'm sorry, I can only answer questions about agriculture, logistics, and decentralized finance. How can I help you with those topics?",
        "That's an interesting question. My expertise is in agribusiness, finance, and logistics. Could you ask something related to those areas?",
        "I can provide market data, explain our escrow process, or give you logistics information. What would you like to know?",
      ],
    };

    let replyPool: (string | (() => string))[] = responses.default;

    if (lowerCaseMessage.includes('price') || lowerCaseMessage.includes('market') || lowerCaseMessage.includes('payment') || lowerCaseMessage.includes('escrow')) {
      replyPool = responses.finance;
    } else if (lowerCaseMessage.includes('logistics') || lowerCaseMessage.includes('shipping') || lowerCaseMessage.includes('delivery')) {
      replyPool = responses.logistics;
    } else if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi') || lowerCaseMessage.includes('hey')) {
      replyPool = responses.greeting;
    }

    const selectedResponse = replyPool[Math.floor(Math.random() * replyPool.length)];
    const reply = typeof selectedResponse === 'function' ? selectedResponse() : selectedResponse;

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