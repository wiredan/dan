import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ListingEntity, OrderEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Listing, Order, User, OrderStatus, UserRole } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  const ensureSeedData = async (env: Env) => {
    await UserEntity.ensureSeed(env);
    await ListingEntity.ensureSeed(env);
    await OrderEntity.ensureSeed(env);
  };
  // USER ROUTES
  app.get('/api/users', async (c) => {
    await ensureSeedData(c.env);
    const { items } = await UserEntity.list(c.env);
    return ok(c, items);
  });
  app.get('/api/users/:id', async (c) => {
    const { id } = c.req.param();
    const user = new UserEntity(c.env, id);
    if (!(await user.exists())) return notFound(c, 'user not found');
    return ok(c, await user.getState());
  });
  app.post('/api/users/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json<Partial<User>>();
    const user = new UserEntity(c.env, id);
    if (!(await user.exists())) return notFound(c, 'user not found');
    const updateData: Partial<User> = {};
    if (isStr(body.name)) updateData.name = body.name;
    if (isStr(body.location)) updateData.location = body.location;
    await user.patch(updateData);
    return ok(c, await user.getState());
  });
  app.post('/api/users/:id/role', async (c) => {
    const { id } = c.req.param();
    const { role } = await c.req.json<{ role: UserRole }>();
    if (!role) return bad(c, 'Missing role');
    const user = new UserEntity(c.env, id);
    if (!(await user.exists())) return notFound(c, 'User not found');
    await user.patch({ role });
    return ok(c, await user.getState());
  });
  app.post('/api/users/promote', async (c) => {
    const { email } = await c.req.json<{ email: string }>();
    if (!isStr(email)) return bad(c, 'Email is required');
    // In our mock setup, the user ID is often the email.
    const userId = email;
    const user = new UserEntity(c.env, userId);
    if (!(await user.exists())) {
      return notFound(c, 'User with that email not found');
    }
    const userState = await user.getState();
    if (userState.role === 'Admin') {
      return bad(c, 'User is already an admin');
    }
    await user.patch({ role: 'Admin' });
    return ok(c, await user.getState());
  });
  // LISTING ROUTES
  app.get('/api/listings', async (c) => {
    await ensureSeedData(c.env);
    const { items } = await ListingEntity.list(c.env);
    return ok(c, items);
  });
  app.get('/api/listings/:id', async (c) => {
    const { id } = c.req.param();
    const listing = new ListingEntity(c.env, id);
    if (!(await listing.exists())) return notFound(c, 'listing not found');
    return ok(c, await listing.getState());
  });
  app.post('/api/listings', async (c) => {
    const body = await c.req.json<Omit<Listing, 'id'>>();
    if (!body.name || !body.farmerId) return bad(c, 'Missing required fields');
    const newListing: Listing = {
      id: crypto.randomUUID(),
      ...body
    };
    await ListingEntity.create(c.env, newListing);
    return ok(c, newListing);
  });
  // ORDER ROUTES
  app.get('/api/orders', async (c) => {
    await ensureSeedData(c.env);
    const { items } = await OrderEntity.list(c.env);
    return ok(c, items);
  });
  app.get('/api/orders/:id', async (c) => {
    const { id } = c.req.param();
    const order = new OrderEntity(c.env, id);
    if (!(await order.exists())) return notFound(c, 'order not found');
    return ok(c, await order.getState());
  });
  app.post('/api/orders', async (c) => {
    const { listingId, buyerId, quantity } = await c.req.json<{ listingId: string; buyerId: string; quantity: number }>();
    if (!listingId || !buyerId || !quantity) return bad(c, 'Missing required fields');
    const listingEntity = new ListingEntity(c.env, listingId);
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
      status: 'Paid', // Assume payment is processed instantly
      createdAt: now,
      statusHistory: [
        { status: 'Placed', timestamp: now },
        { status: 'Paid', timestamp: new Date(Date.now() + 1000).toISOString() } // a second later
      ],
    };
    await OrderEntity.create(c.env, newOrder);
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
    const order = new OrderEntity(c.env, id);
    if (!(await order.exists())) return notFound(c, 'Order not found');
    const updatedOrder = await updateOrderStatus(order, status);
    return ok(c, updatedOrder);
  });
  app.post('/api/orders/:id/dispute', async (c) => {
    const { id } = c.req.param();
    const { reason, evidenceUrl } = await c.req.json<{ reason: string; evidenceUrl: string }>();
    if (!reason) return bad(c, 'Dispute reason is required');
    const order = new OrderEntity(c.env, id);
    if (!(await order.exists())) return notFound(c, 'Order not found');
    const updatedOrder = await updateOrderStatus(order, 'Disputed', { disputeReason: reason, disputeEvidenceUrl: evidenceUrl });
    return ok(c, updatedOrder);
  });
  app.post('/api/orders/:id/resolve', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json<{ status: 'Delivered' | 'Cancelled' }>();
    if (!status || !['Delivered', 'Cancelled'].includes(status)) return bad(c, 'Invalid resolution status');
    const order = new OrderEntity(c.env, id);
    if (!(await order.exists())) return notFound(c, 'Order not found');
    const updatedOrder = await updateOrderStatus(order, status);
    return ok(c, updatedOrder);
  });
  app.post('/api/orders/:id/ai-dispute-analysis', async (c) => {
    const { id } = c.req.param();
    const orderEntity = new OrderEntity(c.env, id);
    if (!(await orderEntity.exists())) return notFound(c, 'Order not found');
    const order = await orderEntity.getState();
    // Simulate AI analysis
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
  app.post('/api/ai/chat', async (c) => {
    const { message } = await c.req.json<{ message: string }>();
    if (!message) return bad(c, 'Message is required');
    // Mock Gemini AI response
    const lowerCaseMessage = message.toLowerCase();
    let reply = "I'm sorry, I can only answer questions about agriculture, logistics, and decentralized finance. How can I help you with those topics?";
    if (lowerCaseMessage.includes('price') || lowerCaseMessage.includes('market')) {
      reply = "Based on current trends, the price for Grade A avocados is stable at around $2.50/kg. However, ginger prices are expected to rise by 5% next month due to increased demand.";
    } else if (lowerCaseMessage.includes('logistics') || lowerCaseMessage.includes('shipping')) {
      reply = "For shipments to Europe, we recommend using our refrigerated container service. The average transit time from Nigeria to the Port of Rotterdam is approximately 18-22 days.";
    } else if (lowerCaseMessage.includes('payment') || lowerCaseMessage.includes('escrow')) {
      reply = "Our secure escrow system holds your payment until you confirm delivery. Funds are then automatically released to the farmer, minus a 2.5% platform fee. This protects both buyers and sellers.";
    }
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return ok(c, { reply });
  });
}