"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import WalletContextProvider from "../../components/WalletContextProvider";
import AuroraBackground from "../../components/AuroraBackground";
import Sidebar from "../../components/Sidebar";
import { fetchWalletProfile, WalletProfile } from "../../lib/wallet-profile";
import { useWallet } from "@solana/wallet-adapter-react";
import CreatorAnalytics from "../../components/CreatorAnalytics";

function short(addr: string) {
  return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}
function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function WalletProfileInner() {
  const router = useRouter();
  const wallet = useWallet();
  const address = router.query.address as string | undefined;
  const [profile, setProfile] = useState<WalletProfile | null>(null);

  useEffect(() => {
    if (!address) return;
    fetchWalletProfile(address).then(setProfile);
    const interval = setInterval(() => fetchWalletProfile(address).then(setProfile), 10000);
    return () => clearInterval(interval);
  }, [address]);

  if (!profile) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <AuroraBackground />
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  const realizedSol = profile.realized_sol / LAMPORTS_PER_SOL;
  const feesEarned = profile.fees_earned_lamports / LAMPORTS_PER_SOL;

  return (
    <div className="min-h-screen text-white flex">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-end px-6 py-5">
          <WalletMultiButton />
        </header>

        <main className="max-w-4xl mx-auto px-6 pb-10">
          <div className="glass rounded-2xl p-5 mb-5">
            <p className="text-xs text-neutral-500">Wallet</p>
            <h1 className="text-2xl display font-bold break-all">{short(profile.address)}</h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-neutral-500">Trades</p>
              <p className="font-semibold text-lg">{profile.trade_count}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-neutral-500">Realized PnL</p>
              <p className={`font-semibold text-lg ${realizedSol >= 0 ? "text-buy" : "text-sell"}`}>
                {realizedSol >= 0 ? "+" : ""}{realizedSol.toFixed(3)} SOL
              </p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-neutral-500">Coins created</p>
              <p className="font-semibold text-lg">{profile.created.length}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-neutral-500">Creator fees earned</p>
              <p className="font-semibold text-lg text-buy">{feesEarned.toFixed(4)} SOL</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 mb-5">
            <h3 className="display font-semibold mb-3">Coins created</h3>
            {profile.created.length === 0 ? (
              <p className="text-sm text-neutral-500">None yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {profile.created.map((c) => (
                  <Link
                    key={c.mint}
                    href={`/token/${c.mint}`}
                    className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-2 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center text-xs font-bold shrink-0">
                      {(c.symbol ?? "?").slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name ?? "..."}</p>
                      <p className="text-xs text-neutral-500">${c.symbol ?? "..."}</p>
                    </div>
                    {c.complete === 1 && (
                      <span className="ml-auto text-[10px] bg-buy/20 text-buy px-2 py-0.5 rounded-full">Migrated</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {wallet.publicKey?.toBase58() === profile.address && profile.created.length > 0 && (
            <div className="mb-5">
              <h3 className="display font-semibold mb-3 px-1">📊 My coin analytics</h3>
              <div className="space-y-3">
                {profile.created.map((c) => (
                  <CreatorAnalytics key={c.mint} mint={c.mint} name={c.name ?? undefined} symbol={c.symbol ?? undefined} />
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-4">
            <h3 className="display font-semibold mb-3">Recent trades</h3>
            {profile.trades.length === 0 ? (
              <p className="text-sm text-neutral-500">No trades yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {profile.trades.map((t) => (
                  <Link
                    key={t.id}
                    href={`/token/${t.mint}`}
                    className="flex items-center justify-between text-sm border-b border-white/5 pb-2 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <span className={t.is_buy ? "text-buy font-medium" : "text-sell font-medium"}>
                      {t.is_buy ? "Buy" : "Sell"}
                    </span>
                    <span className="text-neutral-400">{t.token_name ?? "..."} ${t.token_symbol ?? "..."}</span>
                    <span>{(Number(t.sol_amount) / LAMPORTS_PER_SOL).toFixed(4)} SOL</span>
                    <span className="text-xs text-neutral-500">{timeAgo(t.ts)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function WalletProfilePage() {
  return (
    <WalletContextProvider>
      <WalletProfileInner />
    </WalletContextProvider>
  );
}
