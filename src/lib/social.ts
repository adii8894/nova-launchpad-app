const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Notification = {
  id: number;
  recipient: string;
  type: string;
  message: string;
  mint: string | null;
  read: number;
  ts: number;
};

export async function fetchNotifications(wallet: string): Promise<Notification[]> {
  const res = await fetch(`${API_URL}/api/notifications/${wallet}`);
  if (!res.ok) return [];
  return res.json();
}

export async function markNotificationsRead(wallet: string) {
  return fetch(`${API_URL}/api/notifications/${wallet}/read-all`, { method: "POST" });
}

export async function deleteComment(id: number, requester: string) {
  return fetch(`${API_URL}/api/comments/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requester }),
  });
}

export async function logView(mint: string, viewer: string | null) {
  return fetch(`${API_URL}/api/tokens/${mint}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ viewer }),
  });
}

export async function fetchAnalytics(mint: string) {
  const res = await fetch(`${API_URL}/api/tokens/${mint}/analytics`);
  if (!res.ok) return null;
  return res.json();
}

export async function registerReferral(referred: string, referrer: string) {
  return fetch(`${API_URL}/api/referrals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referred, referrer }),
  });
}

export async function fetchReferrals(wallet: string) {
  const res = await fetch(`${API_URL}/api/referrals/${wallet}`);
  if (!res.ok) return { count: 0, referrals: [] };
  return res.json();
}
