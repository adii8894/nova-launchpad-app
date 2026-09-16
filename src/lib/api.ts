const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type TokenSummary = {
  mint: string;
  creator: string;
  name: string | null;
  symbol: string | null;
  uri: string | null;
  description: string | null;
  created_at: number;
  complete: number;
  trade_count: number;
  volume_lamports: number;
};

export type TokenDetail = TokenSummary & {
  stats: {
    trade_count: number;
    buys: number;
    sells: number;
    buy_vol: number;
    sell_vol: number;
  };
};

export type Trade = {
  id: number;
  mint: string;
  trader: string;
  is_buy: number;
  sol_amount: string;
  token_amount: string;
  signature: string | null;
  ts: number;
};

export type Holder = {
  trader: string;
  net_tokens: number;
  net_sol: number;
};

export type Comment = {
  id: number;
  mint: string;
  author: string;
  body: string;
  ts: number;
};

export async function fetchTokens(sort: "new" | "volume" = "new"): Promise<TokenSummary[]> {
  const res = await fetch(`${API_URL}/api/tokens?sort=${sort}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchTokenDetail(mint: string): Promise<TokenDetail | null> {
  const res = await fetch(`${API_URL}/api/tokens/${mint}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchTrades(mint: string): Promise<Trade[]> {
  const res = await fetch(`${API_URL}/api/tokens/${mint}/trades`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchHolders(mint: string): Promise<Holder[]> {
  const res = await fetch(`${API_URL}/api/tokens/${mint}/holders`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchComments(mint: string): Promise<Comment[]> {
  const res = await fetch(`${API_URL}/api/tokens/${mint}/comments`);
  if (!res.ok) return [];
  return res.json();
}

export async function postComment(mint: string, author: string, body: string) {
  return fetch(`${API_URL}/api/tokens/${mint}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author, body }),
  });
}

export async function setDescription(mint: string, creator: string, description: string) {
  return fetch(`${API_URL}/api/tokens/${mint}/description`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creator, description }),
  });
}

export async function fetchSimilarTokens(mint: string): Promise<TokenSummary[]> {
  const res = await fetch(`${API_URL}/api/tokens/${mint}/similar`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCreatorEarnings(mint: string): Promise<{ total_lamports: number }> {
  const res = await fetch(`${API_URL}/api/tokens/${mint}/creator-earnings`);
  if (!res.ok) return { total_lamports: 0 };
  return res.json();
}
