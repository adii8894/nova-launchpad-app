"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import WalletContextProvider from "../components/WalletContextProvider";
import AuroraBackground from "../components/AuroraBackground";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import { fetchLeaderboard, fetchGlobalFeed, LeaderboardEntry, FeedItem } from "../lib/terminal";
import { fetchTokens, TokenSummary } from "../lib/api";

function short(addr: string) {
  return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}
function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function TerminalInner() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [trending, setTrending] = useState<TokenSummary[]>([]);

  useEffect(() => {
    const load = () => {
      fetchLeaderboard().then(setLeaderboard);
      fetchGlobalFeed().then(setFeed);
      fetchTokens("volume").then(setTrending);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-white flex">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-6 py-5">
          <h1 className="text-2xl display font-bold">
            Terminal
          </h1>
          <WalletMultiButton />
        </header>

        <main className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Leaderboard */}
          <div className="glass rounded-2xl p-4">
            <h3 className="display font-semibold mb-3 flex items-center gap-2">🏆 Leaderboard</h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-neutral-500">No trades yet.</p>
              ) : (
                leaderboard.map((l, i) => {
                  const sol = l.realized_sol / LAMPORTS_PER_SOL;
                  return (
                    <div key={l.trader} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 w-5 text-xs">{i + 1}</span>
                        <span>{short(l.trader)}</span>
                      </div>
                      <span className={sol >= 0 ? "text-buy font-medium" : "text-sell font-medium"}>
                        {sol >= 0 ? "+" : ""}{sol.toFixed(3)} SOL
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live feed */}
          <div className="glass rounded-2xl p-4">
            <h3 className="display font-semibold mb-3 flex items-center gap-2">💬 Live feed</h3>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {feed.length === 0 ? (
                <p className="text-sm text-neutral-500">No activity yet.</p>
              ) : (
                feed.map((item) => (
                  <Link
                    key={item.id}
                    href={`/token/${item.token_mint}`}
                    className="block hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                      <span className="gradient-text font-medium">{short(item.author)}</span>
                      <span>{timeAgo(item.ts)}</span>
                    </div>
                    <p className="text-sm text-neutral-200">{item.body}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      on {item.token_name ?? "..."} <span className="text-neutral-600">${item.token_symbol ?? "..."}</span>
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Trending */}
          <div className="glass rounded-2xl p-4">
            <h3 className="display font-semibold mb-3 flex items-center gap-2">🔥 Trending</h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {trending.length === 0 ? (
                <p className="text-sm text-neutral-500">No coins yet.</p>
              ) : (
                trending.map((t) => (
                  <Link
                    key={t.mint}
                    href={`/token/${t.mint}`}
                    className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center text-xs font-bold shrink-0">
                      {(t.symbol ?? "?").slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.name ?? "..."}</p>
                      <p className="text-xs text-neutral-500">${t.symbol ?? "..."}</p>
                    </div>
                    <span className="text-xs text-neutral-400">
                      {(t.volume_lamports / LAMPORTS_PER_SOL).toFixed(2)} SOL
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </main>
      <MobileNav />
      </div>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <WalletContextProvider>
      <TerminalInner />
    </WalletContextProvider>
  );
}
