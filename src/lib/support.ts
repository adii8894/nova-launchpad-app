const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function postSupport(author: string | null, body: string) {
  return fetch(`${API_URL}/api/support`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author, body }),
  });
}
