const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type WalletProfile = {
  address: string;
  created: {
    mint: string;
    name: string | null;
    symbol: string | null;
    created_at: number;
    complete: number;
  }[];
  trades: {
    id: number;
    mint: string;
    is_buy: number;
    sol_amount: string;
    token_amount: string;
    ts: number;
    token_name: string | null;
    token_symbol: string | null;
  }[];
  realized_sol: number;
  trade_count: number;
  fees_earned_lamports: number;
};

export async function fetchWalletProfile(address: string): Promise<WalletProfile | null> {
  const res = await fetch(`${API_URL}/api/wallet/${address}`);
  if (!res.ok) return null;
  return res.json();
}

export async function searchTokens(q: string) {
  const res = await fetch(`${API_URL}/api/tokens/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

const API_URL2 = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function toggleWatchlist(wallet: string, mint: string) {
  const res = await fetch(`${API_URL2}/api/watchlist/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, mint }),
  });
  return res.json();
}

export async function fetchWatchlist(wallet: string) {
  const res = await fetch(`${API_URL2}/api/watchlist/${wallet}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPortfolio(address: string) {
  const res = await fetch(`${API_URL2}/api/wallet/${address}/portfolio`);
  if (!res.ok) return { holdings: [], total_lamports: 0 };
  return res.json();
}
