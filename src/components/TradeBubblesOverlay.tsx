import React from "react";

type Trade = {
  trader: string;
  is_buy: number;
  sol_amount: string;
};

function short(addr: string) {
  return addr.slice(0, 2).toUpperCase();
}

// Renders a row of small trade "bubbles" above the chart — a lightweight,
// non-chart-library way to show recent trade activity at a glance, similar
// in spirit to pump.fun's avatar bubbles over the price chart.
export default function TradeBubblesOverlay({ trades }: { trades: Trade[] }) {
  const recent = trades.slice(-12);
  if (recent.length === 0) return null;

  const maxSol = Math.max(...recent.map((t) => Number(t.sol_amount)));

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-2">
      {recent.map((t, i) => {
        const ratio = maxSol > 0 ? Number(t.sol_amount) / maxSol : 0;
        const size = 20 + ratio * 20;
        return (
          <div
            key={i}
            className={`rounded-full flex items-center justify-center text-[9px] font-bold text-black shrink-0 ${
              t.is_buy ? "bg-buy" : "bg-sell"
            }`}
            style={{ width: size, height: size }}
            title={`${t.is_buy ? "Buy" : "Sell"} by ${t.trader}`}
          >
            {short(t.trader)}
          </div>
        );
      })}
    </div>
  );
}
