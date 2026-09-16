"use client";

import React, { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import WalletContextProvider from "../components/WalletContextProvider";
import AuroraBackground from "../components/AuroraBackground";
import Sidebar from "../components/Sidebar";
import {
  fetchAdminStats, fetchAdminSupport, fetchAdminComments, adminDeleteComment, fetchAdminTokens,
} from "../lib/admin";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

function short(addr: string) {
  return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}
function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function AdminInner() {
  const wallet = useWallet();
  const [stats, setStats] = useState<any>(null);
  const [support, setSupport] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "comments" | "support" | "tokens">("overview");

  const isAdmin = wallet.publicKey && ADMIN_WALLET && wallet.publicKey.toBase58() === ADMIN_WALLET;

  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminStats().then(setStats);
    fetchAdminSupport().then(setSupport);
    fetchAdminComments().then(setComments);
    fetchAdminTokens().then(setTokens);
  }, [isAdmin]);

  if (!wallet.connected) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <AuroraBackground />
        <div className="text-center">
          <p className="text-neutral-400 mb-4">Connect your wallet to continue.</p>
          <WalletMultiButton />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <AuroraBackground />
        <p className="text-neutral-400">You don't have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-end px-6 py-5">
          <WalletMultiButton />
        </header>

        <main className="max-w-5xl mx-auto px-6 pb-10">
          <h1 className="text-3xl display font-bold mb-6">Admin</h1>

          <div className="flex gap-2 mb-6">
            {(["overview", "comments", "support", "tokens"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                  tab === t ? "gradient-btn text-white" : "glass text-neutral-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Total coins" value={stats.total_tokens} />
              <Stat label="Migrated" value={stats.migrated_tokens} />
              <Stat label="Total trades" value={stats.total_trades} />
              <Stat label="Total volume" value={`${(stats.total_volume_lamports / LAMPORTS_PER_SOL).toFixed(2)} SOL`} />
              <Stat label="Platform earnings" value={`${(stats.platform_earnings_lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`} />
              <Stat label="Unique traders" value={stats.unique_traders} />
              <Stat label="Total comments" value={stats.total_comments} />
            </div>
          )}

          {tab === "comments" && (
            <div className="glass rounded-2xl p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-neutral-500">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2 border-b border-white/5 pb-2 text-sm">
                    <div>
                      <p>
                        <span className="gradient-text font-semibold">{short(c.author)}</span>{" "}
                        on <span className="text-neutral-400">{c.token_name} ${c.token_symbol}</span>
                      </p>
                      <p className="text-neutral-300">{c.body}</p>
                      <p className="text-xs text-neutral-600">{timeAgo(c.ts)}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await adminDeleteComment(c.id);
                        setComments((prev) => prev.filter((x) => x.id !== c.id));
                      }}
                      className="text-xs text-sell shrink-0"
                    >
                      delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "support" && (
            <div className="glass rounded-2xl p-4 space-y-3">
              {support.length === 0 ? (
                <p className="text-sm text-neutral-500">No messages yet.</p>
              ) : (
                support.map((s) => (
                  <div key={s.id} className="border-b border-white/5 pb-2 text-sm">
                    <p className="text-xs text-neutral-500">{s.author ? short(s.author) : "anonymous"} — {timeAgo(s.ts)}</p>
                    <p className="text-neutral-200">{s.body}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "tokens" && (
            <div className="glass rounded-2xl p-4">
              <table className="w-full text-sm">
                <thead className="text-neutral-500 text-left">
                  <tr><th className="pb-2">Coin</th><th className="pb-2">Creator</th><th className="pb-2">Created</th><th className="pb-2">Status</th></tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <tr key={t.mint} className="border-t border-white/5">
                      <td className="py-2">{t.name} <span className="text-neutral-500">${t.symbol}</span></td>
                      <td className="py-2">{short(t.creator)}</td>
                      <td className="py-2 text-neutral-400">{timeAgo(t.created_at)}</td>
                      <td className="py-2">{t.complete ? <span className="text-buy">Migrated</span> : "Active"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-semibold text-lg">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <WalletContextProvider>
      <AdminInner />
    </WalletContextProvider>
  );
}
