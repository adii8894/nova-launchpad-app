"use client";

import React, { useState } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { buyTokens, sellTokens, getCurveState } from "../lib/curveClient";

export default function TradePanel({ mint }: { mint: string }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [slippagePct, setSlippagePct] = useState(2);
  const [status, setStatus] = useState<string | null>(null);

  async function handleTrade() {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setStatus("Submitting trade...");
    try {
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });
      const mintPk = new PublicKey(mint);

      if (side === "buy") {
        const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
        // Quote off current curve state, then apply slippage tolerance.
        const curve = await getCurveState(provider, mintPk);
        const k =
          BigInt(curve.virtualSolReserves.toString()) *
          BigInt(curve.virtualTokenReserves.toString());
        const newVSol = BigInt(curve.virtualSolReserves.toString()) + BigInt(lamports);
        const newVTok = k / newVSol;
        const estOut = BigInt(curve.virtualTokenReserves.toString()) - newVTok;
        const minOut = (estOut * BigInt(100 - slippagePct)) / BigInt(100);

        const sig = await buyTokens(provider, mintPk, lamports, Number(minOut));
        setStatus(`Bought! tx ${sig}`);
      } else {
        const tokenAmount = Math.round(parseFloat(amount) * 1_000_000); // 6 decimals
        const curve = await getCurveState(provider, mintPk);
        const k =
          BigInt(curve.virtualSolReserves.toString()) *
          BigInt(curve.virtualTokenReserves.toString());
        const newVTok = BigInt(curve.virtualTokenReserves.toString()) + BigInt(tokenAmount);
        const newVSol = k / newVTok;
        const estOut = BigInt(curve.virtualSolReserves.toString()) - newVSol;
        const minOut = (estOut * BigInt(100 - slippagePct)) / BigInt(100);

        const sig = await sellTokens(provider, mintPk, tokenAmount, Number(minOut));
        setStatus(`Sold! tx ${sig}`);
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4 space-y-3 max-w-md">
      <div className="flex gap-2">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 rounded p-2 font-medium ${
            side === "buy" ? "bg-emerald-600" : "bg-neutral-900"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 rounded p-2 font-medium ${
            side === "sell" ? "bg-red-600" : "bg-neutral-900"
          }`}
        >
          Sell
        </button>
      </div>

      <input
        className="w-full bg-neutral-900 rounded p-2 text-sm"
        placeholder={side === "buy" ? "SOL amount" : "Token amount"}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <span>Slippage</span>
        {[1, 2, 5].map((p) => (
          <button
            key={p}
            onClick={() => setSlippagePct(p)}
            className={`px-2 py-1 rounded ${
              slippagePct === p ? "bg-neutral-700" : "bg-neutral-900"
            }`}
          >
            {p}%
          </button>
        ))}
      </div>

      <button
        onClick={handleTrade}
        disabled={!wallet.connected || !amount}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded p-2 font-medium"
      >
        {side === "buy" ? "Buy" : "Sell"}
      </button>
      {status && <p className="text-xs text-neutral-400 break-all">{status}</p>}
    </div>
  );
}
