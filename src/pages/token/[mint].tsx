"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import CandleChart from "../../components/CandleChart";
import BubbleMap from "../../components/BubbleMap";
import TradeBubblesOverlay from "../../components/TradeBubblesOverlay";
import WalletContextProvider from "../../components/WalletContextProvider";
import AuroraBackground from "../../components/AuroraBackground";
import { useSession } from "next-auth/react";
import VoiceChat from "../../components/VoiceChat";
import LiveStream from "../../components/LiveStream";
import Sidebar from "../../components/Sidebar";
import MobileNav from "../../components/MobileNav";
import WatchlistButton from "../../components/WatchlistButton";
import AddressLink from "../../components/AddressLink";
import NotificationBell from "../../components/NotificationBell";
import CreatorAnalytics from "../../components/CreatorAnalytics";
import { logView, deleteComment, registerReferral } from "../../lib/social";
import { buyTokens, sellTokens, getCurveState, getCurvePda } from "../../lib/curveClient";
import {
  fetchTokenDetail, fetchTrades, fetchHolders, fetchComments, postComment, setDescription,
  fetchSimilarTokens, fetchCreatorEarnings,
  TokenDetail, Trade, Holder, Comment, TokenSummary,
} from "../../lib/api";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { MIGRATION_SOL_TARGET } from "../../lib/curveClient";

function short(addr: string) {
  return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}
function lamportsToSol(n: number | string) {
  return Number(n) / LAMPORTS_PER_SOL;
}

function TokenDetailInner() {
  const router = useRouter();
  const mint = router.query.mint as string | undefined;
  const { connection } = useConnection();
  const wallet = useWallet();
  const { data: session } = useSession();
  const identity = session?.user?.name || session?.user?.email || wallet.publicKey?.toBase58() || null;

  const [token, setToken] = useState<TokenDetail | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [tokenBalance, setTokenBalance] = useState(0);
  const [curveInfo, setCurveInfo] = useState<{ realSol: number; price: number } | null>(null);
  const [descDraft, setDescDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [similar, setSimilar] = useState<TokenSummary[]>([]);
  const [creatorEarnings, setCreatorEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState<"comments" | "trades">("comments");

  const refresh = useCallback(() => {
    if (!mint) return;
    fetchTokenDetail(mint).then(setToken);
    fetchTrades(mint).then(setTrades);
    fetchHolders(mint).then(setHolders);
    fetchComments(mint).then(setComments);
    fetchSimilarTokens(mint).then(setSimilar);
    fetchCreatorEarnings(mint).then((r) => setCreatorEarnings(r.total_lamports / LAMPORTS_PER_SOL));
  }, [mint]);

  const refreshBalance = useCallback(async () => {
    if (!mint || !wallet.publicKey) return setTokenBalance(0);
    try {
      const ata = getAssociatedTokenAddressSync(new PublicKey(mint), wallet.publicKey);
      const bal = await connection.getTokenAccountBalance(ata);
      setTokenBalance(Number(bal.value.amount) / 1_000_000);
    } catch {
      setTokenBalance(0);
    }
  }, [mint, wallet.publicKey, connection]);

  const refreshCurve = useCallback(async () => {
    if (!mint) return;
    try {
      const [curvePda] = getCurvePda(new PublicKey(mint));
      const accountInfo = await connection.getAccountInfo(curvePda);
      if (!accountInfo) return;
      // Manual light decode isn't worth it here — reuse getCurveState via a throwaway
      // read-only provider (no wallet needed for a pure account fetch).
      const roProvider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      const curve = await getCurveState(roProvider, new PublicKey(mint));
      const realSol = Number(curve.realSolReserves.toString()) / LAMPORTS_PER_SOL;
      const vSol = Number(curve.virtualSolReserves.toString());
      const vTok = Number(curve.virtualTokenReserves.toString());
      const price = vTok > 0 ? vSol / vTok : 0; // lamports per raw token unit
      setCurveInfo({ realSol, price: price * 1_000_000 / LAMPORTS_PER_SOL }); // SOL per whole token
    } catch {
      // curve may not be readable yet right after creation; ignore
    }
  }, [mint, connection, wallet]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 6000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!amount || !mint || parseFloat(amount) <= 0) {
      setPriceImpact(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const roProvider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
        const curve = await getCurveState(roProvider, new PublicKey(mint as string));
        const vSol = Number(curve.virtualSolReserves.toString());
        const vTok = Number(curve.virtualTokenReserves.toString());
        const currentPrice = vSol / vTok;

        let newPrice: number;
        if (side === "buy") {
          const lamportsIn = parseFloat(amount) * LAMPORTS_PER_SOL;
          const newVSol = vSol + lamportsIn;
          const newVTok = (vSol * vTok) / newVSol;
          newPrice = newVSol / newVTok;
        } else {
          const tokensIn = parseFloat(amount) * 1_000_000;
          const newVTok = vTok + tokensIn;
          const newVSol = (vSol * vTok) / newVTok;
          newPrice = newVSol / newVTok;
        }

        const impact = ((newPrice - currentPrice) / currentPrice) * 100;
        setPriceImpact(Math.abs(impact));
      } catch {
        setPriceImpact(null);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [amount, side, mint, connection, wallet]);

  useEffect(() => {
    if (!mint) return;
    logView(mint as string, wallet.publicKey?.toBase58() ?? null);
    const ref = router.query.ref as string | undefined;
    if (ref && wallet.publicKey && ref !== wallet.publicKey.toBase58()) {
      registerReferral(wallet.publicKey.toBase58(), ref);
    }
  }, [mint, wallet.publicKey, router.query.ref]);

  useEffect(() => {
    refreshBalance();
    refreshCurve();
    const interval = setInterval(refreshCurve, 8000);
    return () => clearInterval(interval);
  }, [refreshBalance, refreshCurve]);

  async function handleTrade() {
    if (!wallet.publicKey || !wallet.signTransaction || !mint) return;
    setStatus("Submitting...");
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      const mintPk = new PublicKey(mint);
      if (side === "buy") {
        const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
        const curve = await getCurveState(provider, mintPk);
        const k = BigInt(curve.virtualSolReserves.toString()) * BigInt(curve.virtualTokenReserves.toString());
        const newVSol = BigInt(curve.virtualSolReserves.toString()) + BigInt(lamports);
        const newVTok = k / newVSol;
        const estOut = BigInt(curve.virtualTokenReserves.toString()) - newVTok;
        const minOut = (estOut * BigInt(98)) / BigInt(100);
        const sig = await buyTokens(provider, mintPk, lamports, Number(minOut), new PublicKey(curve.creator));
        setStatus(`Bought! ${sig.slice(0, 12)}...`);
      } else {
        const tokenAmount = Math.round(parseFloat(amount) * 1_000_000);
        const curve = await getCurveState(provider, mintPk);
        const k = BigInt(curve.virtualSolReserves.toString()) * BigInt(curve.virtualTokenReserves.toString());
        const newVTok = BigInt(curve.virtualTokenReserves.toString()) + BigInt(tokenAmount);
        const newVSol = k / newVTok;
        const estOut = BigInt(curve.virtualSolReserves.toString()) - newVSol;
        const minOut = (estOut * BigInt(98)) / BigInt(100);
        const sig = await sellTokens(provider, mintPk, tokenAmount, Number(minOut), new PublicKey(curve.creator));
        setStatus(`Sold! ${sig.slice(0, 12)}...`);
      }
      setAmount("");
      setTimeout(() => { refresh(); refreshBalance(); refreshCurve(); }, 1500);
    } catch (e: any) {
      console.error("FULL TRADE ERROR:", e); setStatus(`Error: ${e.message}`);
    }
  }

  async function handleComment() {
    if (!mint || !wallet.publicKey || !commentText.trim()) return;
    await postComment(mint, wallet.publicKey.toBase58(), commentText.trim());
    setCommentText("");
    fetchComments(mint).then(setComments);
  }

  async function handleSaveDescription() {
    if (!mint || !wallet.publicKey) return;
    await setDescription(mint, wallet.publicKey.toBase58(), descDraft.trim());
    setEditingDesc(false);
    refresh();
  }

  const isCreator = !!(wallet.publicKey && token && wallet.publicKey.toBase58() === token.creator);

  if (!token) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <AuroraBackground />
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  const buyVol = lamportsToSol(token.stats.buy_vol || 0);
  const sellVol = lamportsToSol(token.stats.sell_vol || 0);
  const totalVol = buyVol + sellVol;

  return (
    <div className="min-h-screen text-white flex">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 min-w-0">
      <header className="flex items-center justify-end gap-3 px-6 py-5">
        <NotificationBell />
        <WalletMultiButton />
      </header>

      <main className="px-6 py-8 pb-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-4 glass rounded-2xl p-4">
            <div className="w-14 h-14 rounded-full gradient-btn flex items-center justify-center text-2xl font-bold">
              {(token.symbol ?? "?").slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-2xl display font-bold">
                {token.name} <span className="gradient-text">${token.symbol}</span>
              </h1><WatchlistButton mint={token.mint} /></div>
              <p className="text-xs text-neutral-500">{short(token.mint)}</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Created by</p>
              <p className="text-sm font-medium">{short(token.creator)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Total earned (all their coins)</p>
              <p className="text-sm font-semibold text-buy">{creatorEarnings.toFixed(4)} SOL</p>
            </div>
          </div>

          {curveInfo && (
            <div className="glass rounded-2xl p-4">
              <div className="flex justify-between items-baseline mb-2">
                <div>
                  <p className="text-xs text-neutral-500">Market cap (bonding curve)</p>
                  <p className="text-2xl font-bold display">
                    {(curveInfo.realSol).toFixed(2)} <span className="text-sm text-neutral-400">SOL raised</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Price</p>
                  <p className="text-sm font-mono">{curveInfo.price.toFixed(8)} SOL</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                <div
                  className="h-full gradient-btn"
                  style={{
                    width: `${Math.min(100, (curveInfo.realSol / (MIGRATION_SOL_TARGET / LAMPORTS_PER_SOL)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {token.complete
                  ? "Migrated to open market 🎉"
                  : `${((curveInfo.realSol / (MIGRATION_SOL_TARGET / LAMPORTS_PER_SOL)) * 100).toFixed(1)}% to migration (${(MIGRATION_SOL_TARGET / LAMPORTS_PER_SOL).toFixed(0)} SOL target)`}
              </p>
            </div>
          )}

          <div className="glass rounded-2xl p-4 h-64">
            <TradeBubblesOverlay trades={trades} />
            <CandleChart trades={trades} />
          </div>

          {identity && <VoiceChat mint={mint as string} identity={identity} />}
          {identity && <LiveStream mint={mint as string} identity={identity} />}

          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="display font-semibold">Description</h3>
              {isCreator && !editingDesc && (
                <button
                  onClick={() => { setDescDraft(token.description ?? ""); setEditingDesc(true); }}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Edit
                </button>
              )}
            </div>
            {editingDesc ? (
              <div>
                <textarea
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-aurora2 outline-none"
                  rows={3}
                  maxLength={1000}
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  placeholder="Tell people what this coin is about..."
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveDescription} className="gradient-btn text-sm font-medium px-4 py-1.5 rounded-lg">
                    Save
                  </button>
                  <button onClick={() => setEditingDesc(false)} className="text-sm text-neutral-400 px-4 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                {token.description || "No description yet."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Trades" value={token.stats.trade_count} />
            <Stat label="Buys" value={token.stats.buys} color="text-buy" />
            <Stat label="Sells" value={token.stats.sells} color="text-sell" />
            <Stat label="Volume" value={`${totalVol.toFixed(2)} SOL`} />
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-buy" style={{ width: `${totalVol ? (buyVol / totalVol) * 100 : 50}%` }} />
              <div className="bg-sell" style={{ width: `${totalVol ? (sellVol / totalVol) * 100 : 50}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-buy font-medium">{buyVol.toFixed(2)} buy vol</span>
              <span className="text-sell font-medium">{sellVol.toFixed(2)} sell vol</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="display font-semibold mb-3">Holders</h3>
            <BubbleMap holders={holders} />
            {holders.length === 0 ? (
              <p className="text-sm text-neutral-500">No holders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-neutral-500 text-left">
                  <tr>
                    <th className="font-normal pb-2">Wallet</th>
                    <th className="font-normal pb-2 text-right">Tokens</th>
                    <th className="font-normal pb-2 text-right">Unrealized PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.slice(0, 10).map((h) => {
                    const tokensHeld = h.net_tokens / 1_000_000;
                    const netSolFlow = h.net_sol / LAMPORTS_PER_SOL; // negative = net spent
                    const currentValue = curveInfo ? tokensHeld * curveInfo.price : 0;
                    const pnl = currentValue + netSolFlow;
                    return (
                      <tr key={h.trader} className="border-t border-white/10">
                        <td className="py-2">{short(h.trader)}</td>
                        <td className="py-2 text-right">
                          {tokensHeld.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className={`py-2 text-right font-medium ${pnl >= 0 ? "text-buy" : "text-sell"}`}>
                          {curveInfo ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} SOL` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  activeTab === "comments" ? "gradient-btn text-white" : "text-neutral-400"
                }`}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveTab("trades")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  activeTab === "trades" ? "gradient-btn text-white" : "text-neutral-400"
                }`}
              >
                Trades
              </button>
            </div>

            {activeTab === "comments" ? (
              <>
                {wallet.connected && (
                  <div className="flex gap-2 mb-4">
                    <input
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-aurora2 outline-none"
                      placeholder="Say something..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      maxLength={500}
                    />
                    <button onClick={handleComment} className="gradient-btn text-sm font-medium px-4 py-2 rounded-xl">
                      Post
                    </button>
                  </div>
                )}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-neutral-500">No comments yet.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="text-sm flex items-start justify-between gap-2">
                        <div>
                          <span className="gradient-text font-semibold">{short(c.author)}</span>{" "}
                          <span className="text-neutral-300">{c.body}</span>
                        </div>
                        {isCreator && wallet.publicKey && (
                          <button
                            onClick={async () => {
                              await deleteComment(c.id, wallet.publicKey!.toBase58());
                              fetchComments(mint as string).then(setComments);
                            }}
                            className="text-xs text-neutral-600 hover:text-sell shrink-0"
                          >
                            remove
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {trades.length === 0 ? (
                  <p className="text-sm text-neutral-500">No trades yet.</p>
                ) : (
                  [...trades].reverse().map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                      <span className={t.is_buy ? "text-buy font-medium" : "text-sell font-medium"}>
                        {t.is_buy ? "Buy" : "Sell"}
                      </span>
                      <span className="text-neutral-400">{short(t.trader)}</span>
                      <span>{lamportsToSol(t.sol_amount).toFixed(4)} SOL</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass rounded-2xl p-4 sticky top-6">
            <div className="flex gap-2 mb-4 bg-black/20 rounded-full p-1">
              <button
                onClick={() => setSide("buy")}
                className={`flex-1 py-2 rounded-full font-semibold text-sm transition-all ${
                  side === "buy" ? "bg-buy text-black" : "text-neutral-400"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide("sell")}
                className={`flex-1 py-2 rounded-full font-semibold text-sm transition-all ${
                  side === "sell" ? "bg-sell text-black" : "text-neutral-400"
                }`}
              >
                Sell
              </button>
            </div>

            {!wallet.connected ? (
              <div className="text-center py-6">
                <p className="text-sm text-neutral-400 mb-3">Connect wallet to trade</p>
                <WalletMultiButton />
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/token/${mint}?ref=${wallet.publicKey!.toBase58()}`;
                    navigator.clipboard.writeText(link);
                    setStatus("Referral link copied!");
                  }}
                  className="w-full text-xs text-neutral-400 hover:text-white mb-3 underline"
                >
                  Copy my referral link
                </button>
                <input
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm mb-2 focus:border-aurora2 outline-none"
                  placeholder={side === "buy" ? "SOL amount" : "Token amount"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {side === "sell" && (
                  <p className="text-xs text-neutral-500 mb-2">
                    Balance: {tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {side === "buy"
                    ? ["0.1", "0.5", "1"].map((v) => (
                        <button key={v} onClick={() => setAmount(v)}
                          className="bg-black/30 border border-white/10 rounded-lg py-1.5 text-xs hover:border-aurora2 transition-colors">
                          {v} SOL
                        </button>
                      ))
                    : [25, 50, 100].map((pct) => (
                        <button key={pct}
                          onClick={() => setAmount(((tokenBalance * pct) / 100).toFixed(2))}
                          className="bg-black/30 border border-white/10 rounded-lg py-1.5 text-xs hover:border-aurora2 transition-colors">
                          {pct}%
                        </button>
                      ))}
                </div>
                {priceImpact !== null && priceImpact > 5 && (
                  <p className={`text-xs mb-2 ${priceImpact > 15 ? "text-sell" : "text-yellow-400"}`}>
                    ⚠️ High price impact: this trade moves the price ~{priceImpact.toFixed(1)}%
                  </p>
                )}
                <button
                  onClick={handleTrade}
                  disabled={!amount}
                  className={`w-full py-3 rounded-xl font-semibold disabled:opacity-30 disabled:pointer-events-none ${
                    side === "buy" ? "bg-buy text-black" : "bg-sell text-black"
                  }`}
                >
                  {side === "buy" ? "Buy" : "Sell"}
                </button>
              </>
            )}
            {status && <p className="text-xs text-neutral-400 mt-3 break-all">{status}</p>}
          </div>

          {similar.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <h3 className="display font-semibold mb-3 text-sm">Similar coins</h3>
              <div className="space-y-2">
                {similar.map((s) => (
                  <Link
                    key={s.mint}
                    href={`/token/${s.mint}`}
                    className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center text-xs font-bold shrink-0">
                      {(s.symbol ?? "?").slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.name ?? "..."}</p>
                      <p className="text-xs text-neutral-500">${s.symbol ?? "..."}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileNav />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`font-semibold ${color ?? ""}`}>{value}</p>
    </div>
  );
}

export default function TokenDetailPage() {
  return (
    <WalletContextProvider>
      <TokenDetailInner />
    </WalletContextProvider>
  );
}
