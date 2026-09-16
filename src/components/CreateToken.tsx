"use client";

import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createToken } from "../lib/curveClient";

export default function CreateToken() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [uri, setUri] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleCreate() {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setStatus("Creating token + curve on-chain...");
    try {
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });
      const { signature, mint } = await createToken(provider, {
        name,
        symbol,
        uri,
      });
      setStatus(`Created! Mint: ${mint.toBase58()} — tx ${signature}`);
    } catch (e: any) {
      console.error("FULL ERROR:", e); setStatus(`Error: ${e.message}`);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4 space-y-2 max-w-md">
      <h3 className="font-semibold">Launch a meme coin</h3>
      <input
        className="w-full bg-neutral-900 rounded p-2 text-sm"
        placeholder="Name (e.g. Doge Supreme)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full bg-neutral-900 rounded p-2 text-sm"
        placeholder="Symbol (e.g. DOGES)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
      />
      <input
        className="w-full bg-neutral-900 rounded p-2 text-sm"
        placeholder="Image/metadata URI"
        value={uri}
        onChange={(e) => setUri(e.target.value)}
      />
      <button
        onClick={handleCreate}
        disabled={!wallet.connected || !name || !symbol}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded p-2 font-medium"
      >
        Create Token
      </button>
      {status && <p className="text-xs text-neutral-400 break-all">{status}</p>}
    </div>
  );
}
