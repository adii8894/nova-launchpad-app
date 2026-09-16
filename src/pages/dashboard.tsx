"use client";

import React from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import WalletContextProvider from "../components/WalletContextProvider";
import AuroraBackground from "../components/AuroraBackground";
import Sidebar from "../components/Sidebar";

function DashboardInner() {
  const wallet = useWallet();
  const router = useRouter();

  React.useEffect(() => {
    if (wallet.publicKey) {
      router.replace(`/wallet-profile/${wallet.publicKey.toBase58()}`);
    }
  }, [wallet.publicKey, router]);

  return (
    <div className="min-h-screen text-white flex">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-end px-6 py-5">
          <WalletMultiButton />
        </header>
        <main className="max-w-md mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl display font-bold mb-3">My Dashboard</h1>
          <p className="text-neutral-400 mb-6">Connect your wallet to see your coins, trades, and PnL.</p>
          <WalletMultiButton />
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <WalletContextProvider>
      <DashboardInner />
    </WalletContextProvider>
  );
}
