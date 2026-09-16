"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import WalletContextProvider from "../components/WalletContextProvider";
import AuroraBackground from "../components/AuroraBackground";
import Sidebar from "../components/Sidebar";
import { postSupport } from "../lib/support";
import { useWallet } from "@solana/wallet-adapter-react";

const FAQS = [
  {
    q: "How do I create a coin?",
    a: "Click \"+ Launch coin\" in the sidebar, fill in a name, symbol, and an image URL, then confirm the transaction in your wallet.",
  },
  {
    q: "How does pricing work?",
    a: "Every coin trades on a bonding curve — the price rises as more people buy and falls as people sell. There's no separate liquidity pool until the curve migrates.",
  },
  {
    q: "What's the migration target?",
    a: "Once a coin's curve raises 85 SOL, it's marked as migrated and ready to move to an open market.",
  },
  {
    q: "Do creators earn anything?",
    a: "Yes — 1% of every trade on a coin goes directly to that coin's creator, automatically, on-chain.",
  },
  {
    q: "Is this real money?",
    a: "This app currently runs on Solana Devnet — test SOL only, no real value. Nothing here costs real money.",
  },
];

function SupportInner() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const wallet = useWallet();

  return (
    <div className="min-h-screen text-white flex">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-end px-6 py-5">
          <WalletMultiButton />
        </header>

        <main className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-3xl display font-bold mb-2">Support</h1>
          <p className="text-neutral-400 mb-8">Common questions, and a way to reach us.</p>

          <div className="space-y-3 mb-10">
            {FAQS.map((item, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between"
                >
                  <span className="font-medium text-sm">{item.q}</span>
                  <span className="text-neutral-500">{openIdx === i ? "−" : "+"}</span>
                </button>
                {openIdx === i && (
                  <p className="px-5 pb-4 text-sm text-neutral-400">{item.a}</p>
                )}
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="display font-semibold mb-3">Still stuck?</h3>
            {sent ? (
              <p className="text-sm text-buy">Thanks — we'll get back to you soon.</p>
            ) : (
              <>
                <textarea
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-aurora2 outline-none mb-3"
                  rows={4}
                  placeholder="Describe your issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  onClick={async () => {
                    await postSupport(wallet.publicKey?.toBase58() ?? null, message.trim());
                    setSent(true);
                  }}
                  disabled={!message.trim()}
                  className="gradient-btn text-white text-sm font-medium px-5 py-2.5 rounded-xl disabled:opacity-30"
                >
                  Send message
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <WalletContextProvider>
      <SupportInner />
    </WalletContextProvider>
  );
}
