import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ListingEntity, OrderEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import { MOCK_LISTINGS, MOCK_ORDERS, MOCK_USERS } from "@shared/mock-data";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Ensure seed data for mock API
  const ensureSeedData = async (env: Env) => {
    await UserEntity.ensureSeed(env);
    await ListingEntity.ensureSeed(env);
    await OrderEntity.ensureSeed(env);
  };
  // MOCK API ROUTES
  app.get('/api/users', async (c) => {
    await ensureSeedData(c.env);
    return ok(c, MOCK_USERS);
  });
  app.get('/api/listings', async (c) => {
    await ensureSeedData(c.env);
    return ok(c, MOCK_LISTINGS);
  });
  app.get('/api/listings/:id', async (c) => {
    await ensureSeedData(c.env);
    const listing = MOCK_LISTINGS.find(l => l.id === c.req.param('id'));
    if (listing) return ok(c, listing);
    return notFound(c, 'listing not found');
  });
  app.get('/api/orders', async (c) => {
    await ensureSeedData(c.env);
    return ok(c, MOCK_ORDERS);
  });
  app.get('/api/orders/:id', async (c) => {
    await ensureSeedData(c.env);
    const order = MOCK_ORDERS.find(o => o.id === c.req.param('id'));
    if (order) return ok(c, order);
    return notFound(c, 'order not found');
  });
  // --- LEGACY DEMO ROUTES (can be removed later) ---
  app.get('/api/demo/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const page = await UserEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/demo/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    const user = { id: crypto.randomUUID(), name: name.trim(), role: 'Farmer', kycStatus: 'Not Submitted', location: 'Unknown' } as const;
    return ok(c, await UserEntity.create(c.env, user));
  });
}