import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const items = [
  { href: "/explore", label: "Explore", icon: "🧭" },
  { href: "/terminal", label: "Terminal", icon: "💻" },
  { href: "/create", label: "Launch", icon: "➕" },
  { href: "/wallet", label: "Wallet", icon: "👛" },
  { href: "/dashboard", label: "Me", icon: "👤" },
];

export default function MobileNav() {
  const router = useRouter();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 flex justify-around py-2">
      {items.map((item) => {
        const active = router.pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-[10px] px-2 py-1 rounded-lg ${
              active ? "text-white" : "text-neutral-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
