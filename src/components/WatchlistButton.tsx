import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toggleWatchlist, fetchWatchlist } from "../lib/wallet-profile";

export default function WatchlistButton({ mint }: { mint: string }) {
  const wallet = useWallet();
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (!wallet.publicKey) return;
    fetchWatchlist(wallet.publicKey.toBase58()).then((list: any[]) => {
      setWatching(list.some((t) => t.mint === mint));
    });
  }, [wallet.publicKey, mint]);

  if (!wallet.publicKey) return null;

  return (
    <button
      onClick={async () => {
        const res = await toggleWatchlist(wallet.publicKey!.toBase58(), mint);
        setWatching(res.watching);
      }}
      className={`text-xl transition-transform hover:scale-110 ${watching ? "text-yellow-400" : "text-neutral-600"}`}
      title={watching ? "Remove from watchlist" : "Add to watchlist"}
    >
      {watching ? "★" : "☆"}
    </button>
  );
}
