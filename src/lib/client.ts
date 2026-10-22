/**
 * Sends JSON and returns an error message, or null on success.
 * Never throws — a dropped connection at the pump becomes a readable message instead of a stuck button.
 */
export async function sendJson(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return null;
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? `Request failed (${res.status})`;
  } catch {
    return "No connection — check your network and try again";
  }
}
