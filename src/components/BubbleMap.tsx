import React from "react";

type Holder = {
  trader: string;
  net_tokens: number;
};

function short(addr: string) {
  return addr.length > 6 ? `${addr.slice(0, 3)}..${addr.slice(-3)}` : addr;
}

// Simple deterministic color per wallet, so the same holder always gets the same hue.
function colorFor(addr: string) {
  let hash = 0;
  for (let i = 0; i < addr.length; i++) hash = addr.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export default function BubbleMap({ holders }: { holders: Holder[] }) {
  if (holders.length === 0) {
    return <p className="text-sm text-neutral-500">No holders yet.</p>;
  }

  const max = Math.max(...holders.map((h) => h.net_tokens));
  const sorted = [...holders].sort((a, b) => b.net_tokens - a.net_tokens).slice(0, 20);

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center py-2">
      {sorted.map((h) => {
        const ratio = max > 0 ? h.net_tokens / max : 0;
        const size = 32 + ratio * 88; // 32px min, 120px max
        return (
          <div
            key={h.trader}
            title={`${h.trader} — ${(h.net_tokens / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens`}
            className="rounded-full flex items-center justify-center text-[10px] font-semibold text-black/80 shrink-0 transition-transform hover:scale-105"
            style={{
              width: size,
              height: size,
              background: colorFor(h.trader),
            }}
          >
            {short(h.trader)}
          </div>
        );
      })}
    </div>
  );
}
