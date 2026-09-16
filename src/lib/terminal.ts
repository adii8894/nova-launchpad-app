const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type LeaderboardEntry = {
  trader: string;
  realized_sol: number;
  trade_count: number;
};

export type FeedItem = {
  id: number;
  mint: string;
  author: string;
  body: string;
  ts: number;
  token_name: string | null;
  token_symbol: string | null;
  token_mint: string;
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_URL}/api/leaderboard`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchGlobalFeed(): Promise<FeedItem[]> {
  const res = await fetch(`${API_URL}/api/global-feed`);
  if (!res.ok) return [];
  return res.json();
}
