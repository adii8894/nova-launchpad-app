"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import WalletContextProvider from "../components/WalletContextProvider";
import AuroraBackground from "../components/AuroraBackground";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import { fetchTokens, TokenSummary } from "../lib/api";
import { searchTokens } from "../lib/wallet-profile";

function ExploreInner() {
  const [tokens, setTokens] = useState<TokenSummary[]>([]);
  const [sort, setSort] = useState<"new" | "volume">("new");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TokenSummary[] | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchTokens(sort).then(setTokens).finally(() => setLoading(false));
    const interval = setInterval(() => fetchTokens(sort).then(setTokens), 8000);
    return () => clearInterval(interval);
  }, [sort]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      searchTokens(query).then(setSearchResults);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="min-h-screen text-white flex">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 min-w-0">
      <header className="flex items-center justify-end px-6 py-5">
        <WalletMultiButton />
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        <h1 className="text-4xl display font-bold mb-2">
          Explore <span className="gradient-text">coins</span>
        </h1>
        <p className="text-neutral-400 mb-6">Fresh launches, live on Solana.</p>

        <input
          type="text"
          placeholder="Search coins by name or symbol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md bg-black/30 border border-white/10 rounded-xl p-3 text-sm mb-4 focus:border-aurora2 outline-none"
        />

        <div className="flex gap-2 mb-8">
          {(["new", "volume"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                sort === s ? "gradient-btn text-white" : "glass text-neutral-300"
              }`}
            >
              {s === "new" ? "✨ New" : "📈 Volume"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : (searchResults ?? tokens).length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <p className="text-neutral-400 mb-3">Nothing launched yet.</p>
            <Link href="/create" className="gradient-text font-semibold underline">
              Be the first
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(searchResults ?? tokens).map((t: TokenSummary) => (
              <Link
                key={t.mint}
                href={`/token/${t.mint}`}
                className="glass rounded-2xl p-4 hover:border-white/25 hover:-translate-y-1 transition-all block"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full gradient-btn flex items-center justify-center text-lg font-bold">
                    {(t.symbol ?? "?").slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.name ?? "Loading..."}</p>
                    <p className="text-xs text-neutral-400">${t.symbol ?? "..."}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-neutral-400 pt-2 border-t border-white/10">
                  <span>{t.trade_count} trades</span>
                  <span>{(t.volume_lamports / 1_000_000_000).toFixed(2)} SOL</span>
                </div>
                {t.complete === 1 && (
                  <span className="inline-block mt-2 text-[10px] bg-buy/20 text-buy px-2 py-0.5 rounded-full font-medium">
                    Migrated
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <MobileNav />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <WalletContextProvider>
      <ExploreInner />
    </WalletContextProvider>
  );
}
