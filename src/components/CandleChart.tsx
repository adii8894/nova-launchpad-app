import React from "react";
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export type Trade = {
  sol_amount: string;
  token_amount: string;
  ts: number;
};

type Candle = {
  idx: number;
  open: number;
  high: number;
  low: number;
  close: number;
  isUp: boolean;
};

function priceOf(t: Trade) {
  const sol = Number(t.sol_amount) / 1_000_000_000;
  const tok = Number(t.token_amount) / 1_000_000;
  return tok > 0 ? sol / tok : 0;
}

function buildCandles(trades: Trade[], buckets = 30): Candle[] {
  if (trades.length === 0) return [];
  const prices = trades.map(priceOf);
  const groupSize = Math.max(1, Math.ceil(prices.length / buckets));
  const candles: Candle[] = [];

  for (let i = 0; i < prices.length; i += groupSize) {
    const group = prices.slice(i, i + groupSize);
    if (group.length === 0) continue;
    const open = group[0];
    const close = group[group.length - 1];
    let high = Math.max(...group);
    let low = Math.min(...group);
    if (high === low) {
      // Single-trade candle: give it a tiny visible wick instead of collapsing to a flat dash.
      const bump = (high || 0.0000001) * 0.01;
      high += bump;
      low -= bump;
    }
    // Direction should reflect real price movement. For single-trade candles
    // open===close internally, so compare against the previous candle's
    // close instead — same convention real candlestick charts use.
    const prevClose = candles.length > 0 ? candles[candles.length - 1].close : open;
    const isUp = close >= prevClose;
    candles.push({ idx: candles.length, open, high, low, close, isUp });
  }
  return candles;
}

// Range-bar shape: x/y/width/height already represent the pixel rect spanning
// [low, high] for this candle (recharts computes this from the [low, high]
// dataKey accessor). We interpolate open/close positions within that rect.
function CandleShape(props: any) {
  const { x, y, width, height, payload } = props;
  const { open, high, low, close, isUp } = payload as Candle;
  const color = isUp ? "#22d3a5" : "#fb5c7c";
  const range = high - low || 1;

  const priceToY = (v: number) => y + ((high - v) / range) * height;
  const bodyTop = priceToY(Math.max(open, close));
  const bodyBottom = priceToY(Math.min(open, close));
  const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);
  const cx = x + width / 2;

  return (
    <g>
      <line x1={cx} y1={y} x2={cx} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect x={x + width * 0.2} y={bodyTop} width={width * 0.6} height={bodyHeight} fill={color} rx={1} />
    </g>
  );
}

export default function CandleChart({ trades }: { trades: Trade[] }) {
  const candles = buildCandles(trades);

  if (candles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
        No trades yet — be the first to buy
      </div>
    );
  }

  const allLows = candles.map((c) => c.low);
  const allHighs = candles.map((c) => c.high);
  const min = Math.min(...allLows);
  const max = Math.max(...allHighs);
  const pad = (max - min) * 0.1 || max * 0.05 || 0.0000001;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={candles} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="idx" hide />
        <YAxis hide domain={[min - pad, max + pad]} />
        <Tooltip
          contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
          formatter={(_: any, __: any, item: any) => {
            const p = item?.payload as Candle;
            if (!p) return ["", ""];
            return [
              `O ${p.open.toFixed(8)}  H ${p.high.toFixed(8)}  L ${p.low.toFixed(8)}  C ${p.close.toFixed(8)}`,
              "SOL / token",
            ];
          }}
        />
        <Bar dataKey={(d: Candle) => [d.low, d.high]} shape={<CandleShape />} isAnimationActive={false} barSize={16} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
