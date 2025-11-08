import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ListingEntity, OrderEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Listing, Order, User } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Ensure seed data for mock API
  const ensureSeedData = async (env: Env) => {
    await UserEntity.ensureSeed(env);
    await ListingEntity.ensureSeed(env);
    await OrderEntity.ensureSeed(env);
  };
  // --- LIVE API ROUTES ---
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
    // Only allow updating specific fields
    const updateData: Partial<User> = {};
    if (isStr(body.name)) updateData.name = body.name;
    if (isStr(body.location)) updateData.location = body.location;
    await user.patch(updateData);
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
}