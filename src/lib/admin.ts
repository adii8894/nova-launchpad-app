const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchAdminStats() {
  const res = await fetch(`${API_URL}/api/admin/stats`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAdminSupport() {
  const res = await fetch(`${API_URL}/api/admin/support`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAdminComments() {
  const res = await fetch(`${API_URL}/api/admin/comments`);
  if (!res.ok) return [];
  return res.json();
}

export async function adminDeleteComment(id: number) {
  return fetch(`${API_URL}/api/admin/comments/${id}`, { method: "DELETE" });
}

export async function fetchAdminTokens() {
  const res = await fetch(`${API_URL}/api/admin/tokens`);
  if (!res.ok) return [];
  return res.json();
}
