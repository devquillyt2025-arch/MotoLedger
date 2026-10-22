import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;
let instance: DB | undefined;

// Failures where the TCP/TLS connection never opened, so the query was never sent and a retry can't
// double-apply a write. Anything else (a response, a reset mid-request) is surfaced, not retried.
const PRE_SEND_ERRORS = new Set(["UND_ERR_CONNECT_TIMEOUT", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH"]);
const RETRIES = 2;

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      const code = (err as { cause?: { code?: string } })?.cause?.code;
      if (attempt >= RETRIES || !code || !PRE_SEND_ERRORS.has(code)) throw err;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
}

function getDb(): DB {
  if (!instance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set — copy .env.example to .env.local and fill it in.");
    }
    // Slow mobile networks often take >10s to connect to Neon; retry those connection failures.
    neonConfig.fetchFunction = fetchWithRetry;
    // no-store: Next 14 patches fetch and would otherwise cache Neon's HTTP queries, serving stale rows.
    instance = drizzle(neon(process.env.DATABASE_URL, { fetchOptions: { cache: "no-store" } }), { schema });
  }
  return instance;
}

// Connect on first query, not at import, so `next build` works without the env var.
export const db = new Proxy({} as DB, { get: (_, prop) => Reflect.get(getDb(), prop) });
