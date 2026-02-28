import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCatalog, getCategoryCounts } from "../api/catalog";
import type { CategoryCounts, Feed } from "../types";
import { StatCard } from "../components/shared/index";

export default function Home() {
  const [counts, setCounts] = useState<CategoryCounts | null>(null);
  const [feeds, setFeeds] = useState<Feed[]>([]);

  useEffect(() => {
    getCatalog().then(setFeeds).catch(() => {});
    getCategoryCounts().then(setCounts).catch(() => {});
  }, []);

  const totalCalls = feeds.reduce((a, f) => a + f.callCount, 0);
  const totalEarned = (feeds.reduce((a, f) => a + f.totalEarnedAtomic, 0) / 1e6).toFixed(2);
  const totalFeeds = feeds.length;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-glow-cyan" />
      <div className="pointer-events-none absolute inset-0 bg-glow-violet" />

      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 border border-cyan/20 bg-cyan/5 text-cyan text-xs font-mono px-4 py-1.5 rounded-full mb-8 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-slow" />
          Base Sepolia · x402 Micropayments
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-extrabold text-text-1 leading-tight mb-6 animate-fade-up stagger-1">
          Sell any API.<br />
          <span className="text-glow-cyan text-cyan">$0.01 per call.</span>
        </h1>

        <p className="text-text-2 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up stagger-2">
          Turn any real-time data API into a paid endpoint in minutes.
          No subscriptions, no billing infra — just x402 micropayments on Base.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up stagger-3">
          <Link
            to="/catalog"
            className="px-8 py-3.5 bg-cyan text-bg font-semibold rounded-xl hover:bg-cyan-hover transition-colors text-sm"
          >
            Browse Feeds →
          </Link>
          <Link
            to="/provider"
            className="px-8 py-3.5 border border-border-2 text-text-1 font-medium rounded-xl hover:border-cyan/30 hover:text-cyan transition-colors text-sm"
          >
            Sell Your API
          </Link>
          <Link
            to="/how-it-works"
            className="text-text-3 text-sm hover:text-text-2 transition-colors underline underline-offset-4"
          >
            How does x402 work?
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Active Feeds"
            value={totalFeeds}
            sub="registered on platform"
            accent="cyan"
            className="animate-fade-up stagger-1"
          />
          <StatCard
            label="Total Calls"
            value={totalCalls.toLocaleString()}
            sub="paid requests served"
            accent="violet"
            className="animate-fade-up stagger-2"
          />
          <StatCard
            label="USDC Earned"
            value={`$${totalEarned}`}
            sub="paid to providers"
            accent="emerald"
            className="animate-fade-up stagger-3"
          />
          <StatCard
            label="Per Call"
            value="$0.01"
            sub="flat rate, testnet USDC"
            accent="cyan"
            className="animate-fade-up stagger-4"
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="card p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold text-text-1 text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { step: "01", title: "Provider registers API",  body: "Wrap any upstream URL — CoinGecko, sports data, weather, anything.",   icon: "📡" },
              { step: "02", title: "Consumer hits /feed/:id",  body: "GET request returns 402 with USDC payment requirements.",               icon: "⚡" },
              { step: "03", title: "Sign EIP-3009 auth",       body: "Consumer wallet signs gasless USDC authorization. No ETH needed.",      icon: "✍️" },
              { step: "04", title: "Data flows, USDC moves",   body: "Server verifies via facilitator, proxies upstream, stats recorded.",    icon: "💸" },
            ].map(({ step, title, body, icon }, i) => (
              <div key={step} className={`relative animate-fade-up stagger-${i + 1}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center shrink-0 text-lg">
                    {icon}
                  </div>
                  <div>
                    <p className="text-text-3 text-[10px] font-mono mb-1">{step}</p>
                    <h3 className="font-display font-semibold text-text-1 text-sm mb-1.5">{title}</h3>
                    <p className="text-text-2 text-xs leading-relaxed">{body}</p>
                  </div>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px border-t border-dashed border-border-2 -translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {counts && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <h2 className="font-display text-xl font-bold text-text-1 mb-6">Browse by category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["finance", "sports", "weather", "custom"] as const).map((cat, i) => {
              const icons: Record<string, string> = { finance: "💹", sports: "🏆", weather: "🌤", custom: "⚙️" };
              const colors: Record<string, string> = {
                finance: "text-cyan border-cyan/20 bg-cyan/5 hover:bg-cyan/10",
                sports:  "text-emerald border-emerald/20 bg-emerald/5 hover:bg-emerald/10",
                weather: "text-amber border-amber/20 bg-amber/5 hover:bg-amber/10",
                custom:  "text-violet border-violet/20 bg-violet/5 hover:bg-violet/10",
              };
              return (
                <Link
                  key={cat}
                  to={`/catalog?category=${cat}`}
                  className={`card border px-5 py-6 flex items-center gap-4 transition-all animate-fade-up stagger-${i+1} ${colors[cat]}`}
                >
                  <span className="text-2xl">{icons[cat]}</span>
                  <div>
                    <p className="font-display font-semibold capitalize">{cat}</p>
                    <p className="text-[11px] font-mono opacity-70">{counts[cat]} feeds</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}