import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import GoogleSignIn from "./GoogleSignIn";

const items = [
  { href: "/explore", label: "Explore", icon: "🧭" },
  { href: "/explore?sort=volume", label: "Trending", icon: "🔥" },
  { href: "/wallet", label: "Wallet", icon: "👛" },
  { href: "/terminal", label: "Terminal", icon: "💻" },
  { href: "/dashboard", label: "My Dashboard", icon: "👤" },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 glass border-r border-white/10 p-4">
      <Link href="/explore" className="text-2xl display font-bold gradient-text mb-8 px-2">
        Nova
      </Link>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = router.pathname === item.href.split("?")[0] &&
            (item.href.includes("sort=volume") ? router.query.sort === "volume" : !router.query.sort);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-3">
        <GoogleSignIn />
      </div>

      <Link
        href="/create"
        className="gradient-btn text-white font-semibold rounded-xl py-3 text-center text-sm shadow-lg shadow-purple-900/30"
      >
        + Launch coin
      </Link>

      <p className="text-[10px] text-neutral-600 mt-4 px-2">Devnet · non-custodial</p>
    </aside>
  );
}
