"use client";

import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

/**
 * Non-custodial deposit/withdraw.
 * "Deposit" = show the connected wallet's own address (fund it from an
 *   exchange, another wallet, or a bridge — funds land directly in the
 *   user's own Solana wallet, the platform never custodies them).
 * "Withdraw" = send SOL from the connected wallet to any external address.
 * Buying/selling meme coins spends directly from this same wallet via the
 * bonding curve program (see curveClient.ts) — there is no separate
 * platform balance to keep in sync.
 */
export default function DepositWithdraw() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [withdrawTo, setWithdrawTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  React.useEffect(() => {
    if (!wallet.publicKey) return;
    connection.getBalance(wallet.publicKey).then((b) =>
      setBalance(b / LAMPORTS_PER_SOL)
    );
  }, [wallet.publicKey, connection, status]);

  async function handleWithdraw() {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setStatus("Sending...");
    try {
      const to = new PublicKey(withdrawTo);
      const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: to,
          lamports,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setStatus(`Sent. Signature: ${sig}`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  }

  if (!wallet.connected) {
    return <p className="text-sm text-neutral-400">Connect your wallet to deposit or withdraw.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-800 p-4">
        <h3 className="font-semibold mb-2">Deposit</h3>
        <p className="text-sm text-neutral-400 mb-2">
          Send SOL to your wallet address below from any exchange or wallet.
          It lands directly in your wallet — the platform never holds your funds.
        </p>
        <code className="block break-all bg-neutral-900 rounded p-2 text-sm">
          {wallet.publicKey?.toBase58()}
        </code>
        {balance !== null && (
          <p className="text-sm text-neutral-400 mt-2">Balance: {balance.toFixed(4)} SOL</p>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 p-4">
        <h3 className="font-semibold mb-2">Withdraw</h3>
        <input
          className="w-full mb-2 bg-neutral-900 rounded p-2 text-sm"
          placeholder="Destination Solana address"
          value={withdrawTo}
          onChange={(e) => setWithdrawTo(e.target.value)}
        />
        <input
          className="w-full mb-2 bg-neutral-900 rounded p-2 text-sm"
          placeholder="Amount (SOL)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          onClick={handleWithdraw}
          className="w-full bg-emerald-600 hover:bg-emerald-500 rounded p-2 font-medium"
        >
          Withdraw
        </button>
        {status && <p className="text-xs text-neutral-400 mt-2 break-all">{status}</p>}
      </div>
    </div>
  );
}
