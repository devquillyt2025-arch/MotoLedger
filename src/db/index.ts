import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;
let instance: DB | undefined;

function getDb(): DB {
  if (!instance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set — copy .env.example to .env.local and fill it in.");
    }
    // no-store: Next 14 patches fetch and would otherwise cache Neon's HTTP queries, serving stale rows.
    instance = drizzle(neon(process.env.DATABASE_URL, { fetchOptions: { cache: "no-store" } }), { schema });
  }
  return instance;
}

// Connect on first query, not at import, so `next build` works without the env var.
export const db = new Proxy({} as DB, { get: (_, prop) => Reflect.get(getDb(), prop) });
