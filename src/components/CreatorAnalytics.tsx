import React, { useEffect, useState } from "react";
import { fetchAnalytics } from "../lib/social";

export default function CreatorAnalytics({ mint, name, symbol }: { mint: string; name?: string; symbol?: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics(mint).then(setData);
  }, [mint]);

  if (!data) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="display font-semibold mb-3">
        📊 {name ?? "Coin"} {symbol ? `($${symbol})` : ""}
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-neutral-500">Total views</p>
          <p className="font-semibold text-lg">{data.total_views}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Unique viewers</p>
          <p className="font-semibold text-lg">{data.unique_viewers}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Unique traders</p>
          <p className="font-semibold text-lg">{data.unique_traders}</p>
        </div>
      </div>
      {data.trades_by_day.length > 0 && (
        <div>
          <p className="text-xs text-neutral-500 mb-1">Trades by day</p>
          <div className="flex gap-1 items-end h-16">
            {data.trades_by_day.map((d: any) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.count} trades`}
                className="bg-brand-gradient rounded-t flex-1"
                style={{ height: `${Math.min(100, d.count * 10)}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
