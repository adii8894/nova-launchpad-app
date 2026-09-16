"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import WalletContextProvider from "../components/WalletContextProvider";
import AuroraBackground from "../components/AuroraBackground";
import Sidebar from "../components/Sidebar";
import { createToken } from "../lib/curveClient";

function CreateInner() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [uri, setUri] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setBusy(true);
    setStatus("Creating token + curve on-chain...");
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      const { mint } = await createToken(provider, { name, symbol, uri });
      setStatus("Created! Redirecting...");
      setTimeout(() => router.push(`/token/${mint.toBase58()}`), 800);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen text-white flex">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 min-w-0">
      <header className="flex items-center justify-end px-6 py-5">
        <WalletMultiButton />
      </header>

      <main className="max-w-md mx-auto px-6 py-14">
        <h1 className="text-3xl display font-bold mb-1">
          Launch your <span className="gradient-text">coin</span>
        </h1>
        <p className="text-neutral-400 text-sm mb-6">Fixed 1B supply. Tradeable instantly.</p>

        <div className="glass rounded-3xl p-6 space-y-4">
          <div>
            <label className="text-xs text-neutral-400 font-medium">Name</label>
            <input
              className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-aurora2 outline-none transition-colors"
              placeholder="Doge Supreme"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 font-medium">Symbol</label>
            <input
              className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-aurora2 outline-none transition-colors"
              placeholder="DOGES"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 font-medium">Image URI</label>
            <input
              className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-aurora2 outline-none transition-colors"
              placeholder="https://..."
              value={uri}
              onChange={(e) => setUri(e.target.value)}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!wallet.connected || !name || !symbol || busy}
            className="w-full gradient-btn text-white font-semibold rounded-xl p-3.5 disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-purple-900/30"
          >
            {busy ? "Creating..." : "Launch coin"}
          </button>
          {status && <p className="text-xs text-neutral-400 break-all">{status}</p>}
        </div>
      </main>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <WalletContextProvider>
      <CreateInner />
    </WalletContextProvider>
  );
}
