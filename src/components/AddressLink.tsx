import React from "react";
import Link from "next/link";

function short(addr: string) {
  return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}

export default function AddressLink({ address, className }: { address: string; className?: string }) {
  return (
    <Link href={`/wallet-profile/${address}`} className={className ?? "hover:underline"}>
      {short(address)}
    </Link>
  );
}
