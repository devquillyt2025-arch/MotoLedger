import { NextResponse } from "next/server";

export const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });
export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

/** Parses a positive integer route id, or null. */
export function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Wraps a route handler so DB/network failures come back as JSON the UI can show, not an HTML 500. */
export function withErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Server error — please try again" }, { status: 500 });
    }
  };
}
