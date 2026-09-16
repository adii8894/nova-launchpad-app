import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchNotifications, markNotificationsRead, Notification } from "../lib/social";

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function NotificationBell() {
  const wallet = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!wallet.publicKey) return;
    const load = () => fetchNotifications(wallet.publicKey!.toBase58()).then(setNotifications);
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [wallet.publicKey]);

  if (!wallet.publicKey) return null;

  const unreadCount = notifications.filter((n) => n.read === 0).length;

  return (
    <div className="relative">
      <button
        onClick={async () => {
          setOpen(!open);
          if (!open && unreadCount > 0) {
            await markNotificationsRead(wallet.publicKey!.toBase58());
            setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
          }
        }}
        className="relative glass w-10 h-10 rounded-full flex items-center justify-center"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-sell text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass rounded-2xl p-3 z-50 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-2 px-1">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-neutral-500 px-1 py-3">Nothing yet.</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.mint ? `/token/${n.mint}` : "#"}
                onClick={() => setOpen(false)}
                className="block px-2 py-2 rounded-lg hover:bg-white/5 text-sm"
              >
                <p>{n.message}</p>
                <p className="text-xs text-neutral-500">{timeAgo(n.ts)}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
