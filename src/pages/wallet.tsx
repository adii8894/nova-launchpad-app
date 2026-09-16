"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import WalletContextProvider from "../components/WalletContextProvider";
import AuroraBackground from "../components/AuroraBackground";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";

function WalletInner() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [withdrawTo, setWithdrawTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!wallet.publicKey) return;
    connection.getBalance(wallet.publicKey).then((b) => setBalance(b / LAMPORTS_PER_SOL));
  }, [wallet.publicKey, connection, status]);

  async function handleWithdraw() {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setStatus("Sending...");
    try {
      const to = new PublicKey(withdrawTo);
      const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: to, lamports })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setStatus(`Sent! ${sig.slice(0, 12)}...`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
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
        <h1 className="text-3xl display font-bold mb-1">Your wallet</h1>
        <p className="text-neutral-400 text-sm mb-6">Non-custodial — funds never leave your control.</p>

        {!wallet.connected ? (
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-neutral-400 mb-4">Connect your wallet to continue.</p>
            <WalletMultiButton />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="glass rounded-2xl p-5">
              <h3 className="display font-semibold mb-2">Deposit</h3>
              <p className="text-sm text-neutral-400 mb-3">
                Send SOL to your address below from any exchange or wallet. It lands directly here —
                we never hold your funds.
              </p>
              <code className="block break-all bg-black/30 border border-white/10 rounded-xl p-3 text-sm">
                {wallet.publicKey?.toBase58()}
              </code>
              {balance !== null && (
                <p className="text-sm text-neutral-400 mt-3">
                  Balance: <span className="text-white font-semibold">{balance.toFixed(4)} SOL</span>
                </p>
              )}
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="display font-semibold mb-3">Withdraw</h3>
              <input
                className="w-full mb-3 bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-aurora2 outline-none"
                placeholder="Destination Solana address"
                value={withdrawTo}
                onChange={(e) => setWithdrawTo(e.target.value)}
              />
              <input
                className="w-full mb-3 bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-aurora2 outline-none"
                placeholder="Amount (SOL)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                onClick={handleWithdraw}
                disabled={!withdrawTo || !amount}
                className="w-full gradient-btn rounded-xl p-3 font-semibold disabled:opacity-30 disabled:pointer-events-none"
              >
                Withdraw
              </button>
              {status && <p className="text-xs text-neutral-400 mt-3 break-all">{status}</p>}
            </div>
          </div>
        )}
      </main>
      <MobileNav />
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <WalletContextProvider>
      <WalletInner />
    </WalletContextProvider>
  );
}
