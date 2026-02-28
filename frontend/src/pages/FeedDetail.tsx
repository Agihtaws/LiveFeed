import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { getFeedById } from "../api/catalog";
import { getFeedStats } from "../api/feeds";
import { useX402Payment } from "../hooks/useX402Payment";
import CategoryBadge from "../components/shared/CategoryBadge";
import { StatusBadge, LoadingSpinner, ErrorBanner } from "../components/shared/index";
import TestCallModal from "../components/catalog/TestCallModal";
import SnippetModal from "../components/catalog/SnippetModal";
import PayResultModal from "../components/catalog/PayResultModal";
import CopyButton from "../components/shared/CopyButton";

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_MSG: Record<string, string> = {
  fetching: "Hitting endpoint...",
  signing:  "Waiting for wallet signature...",
  paying:   "Verifying payment...",
};

export default function FeedDetail() {
  const { id } = useParams<{ id: string }>();
  const [showTest,    setShowTest]    = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [showResult,  setShowResult]  = useState(false);

  const { pay, reset, result, isConnected } = useX402Payment();
  const { openConnectModal } = useConnectModal();

  const { data: feed, isLoading, error } = useQuery({
    queryKey: ["feed", id],
    queryFn:  () => getFeedById(id!),
    enabled:  !!id,
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["feed-stats", id],
    queryFn:  () => getFeedStats(id!),
    enabled:  !!id,
    refetchInterval: 10_000,
  });

  const isBusy = ["fetching", "signing", "paying"].includes(result.status);

  const handlePay = async () => {
    if (!feed) return;
    if (!isConnected) { openConnectModal?.(); return; }
    reset();
    setShowResult(false);
    await pay(feed);
    setShowResult(true);
    // Refresh stats after payment so callCount updates
    setTimeout(() => refetchStats(), 1000);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (error || !feed) return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <ErrorBanner message={(error as Error)?.message ?? "Feed not found"} />
      <Link to="/catalog" className="inline-flex items-center gap-2 text-text-2 hover:text-cyan transition-colors mt-6 text-sm font-mono">
        ← Back to catalog
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-text-3 mb-8 animate-fade-up">
        <Link to="/catalog" className="hover:text-cyan transition-colors">Catalog</Link>
        <span>/</span>
        <span className="text-text-2">{feed.name}</span>
      </div>

      {/* Header card */}
      <div className="card p-8 mb-6 animate-fade-up stagger-1">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <CategoryBadge category={feed.category} size="md" />
              <StatusBadge status={feed.status} />
            </div>
            <h1 className="font-display text-3xl font-bold text-text-1 mb-3">{feed.name}</h1>
            <p className="text-text-2 leading-relaxed">{feed.description}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-widest mb-1">Price per call</p>
            <p className="font-mono text-4xl font-bold text-cyan">{feed.price}</p>
            <p className="text-text-3 text-xs font-mono mt-1">USDC on Base Sepolia</p>
          </div>
        </div>

        {/* Payment status bar */}
        {isBusy && (
          <div className="mt-4 flex items-center gap-3 bg-violet/5 border border-violet/20 rounded-xl px-4 py-3">
            <div className="w-4 h-4 rounded-full border-2 border-violet border-t-transparent animate-spin shrink-0" />
            <p className="text-violet text-sm font-mono">{STATUS_MSG[result.status]}</p>
          </div>
        )}

        {/* Payment error */}
        {result.status === "error" && result.error && (
          <div className="mt-4">
            <ErrorBanner message={result.error} />
            {result.error.includes("faucet") && (
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan text-xs font-mono mt-2 hover:underline"
              >
                → Get testnet USDC at faucet.circle.com
              </a>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
          {/* Primary — Pay & Call */}
          <button
            onClick={handlePay}
            disabled={isBusy || feed.status !== "active"}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all
              ${isBusy
                ? "bg-violet/10 border border-violet/30 text-violet cursor-wait"
                : feed.status !== "active"
                  ? "bg-surface-2 border border-border text-text-3 cursor-not-allowed"
                  : isConnected
                    ? "bg-cyan text-bg hover:bg-cyan-hover active:scale-[0.98]"
                    : "bg-surface-2 border border-border-2 text-text-2 hover:text-cyan hover:border-cyan/40"
              }
            `}
          >
            {isBusy
              ? <><div className="w-3 h-3 rounded-full border-2 border-violet border-t-transparent animate-spin" /> {STATUS_MSG[result.status]}</>
              : isConnected
                ? <>💳 Pay {feed.price} & Call</>
                : <>🔗 Connect Wallet to Pay</>
            }
          </button>

          {/* Secondary actions */}
          <button
            onClick={() => setShowTest(true)}
            className="flex items-center gap-2 px-5 py-3 border border-border-2 bg-surface-2 text-text-2 rounded-xl text-sm font-medium hover:text-text-1 transition-colors"
          >
            ▶ Test Free
          </button>
          <button
            onClick={() => setShowSnippet(true)}
            className="flex items-center gap-2 px-5 py-3 border border-border-2 bg-surface-2 text-text-2 rounded-xl text-sm font-medium hover:text-text-1 transition-colors"
          >
            {"</>"} SDK Snippet
          </button>
          <CopyButton text={feed.id} label="Copy Feed ID" className="px-4 py-3 text-sm" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-up stagger-2">
        {[
          { label: "Total Calls", value: (stats?.callCount ?? feed.callCount).toLocaleString(), accent: "text-cyan" },
          { label: "USDC Earned", value: `$${stats?.earnedUsdc ?? "0.00"}`,                      accent: "text-emerald" },
          { label: "Avg Latency", value: stats?.avgLatencyMs ? `${stats.avgLatencyMs}ms` : "—",  accent: "text-violet" },
          { label: "Last Called", value: timeAgo(stats?.lastCalledAt ?? feed.lastCalledAt),       accent: "text-text-1" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="card p-4">
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-widest mb-2">{label}</p>
            <p className={`font-mono text-xl font-semibold ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Feed details */}
      <div className="card p-6 mb-4 animate-fade-up stagger-3">
        <h2 className="font-display font-semibold text-text-1 mb-4">Feed Details</h2>
        <div className="space-y-3">
          {[
            { label: "Feed ID",    value: feed.id },
            { label: "Method",     value: feed.method },
            { label: "Registered", value: new Date(feed.createdAt).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-text-3 text-xs font-mono uppercase tracking-wider">{label}</span>
              <span className="text-text-1 text-sm font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* x402 flow explainer */}
      <div className="card p-6 border-cyan/10 animate-fade-up stagger-4">
        <h2 className="font-display font-semibold text-text-1 mb-4">Payment Flow</h2>
        <div className="space-y-3">
          {[
            { n: "1", text: `GET /feed/${feed.id} → server returns 402` },
            { n: "2", text: "402 body contains USDC amount + payTo address" },
            { n: "3", text: "Your wallet signs EIP-3009 authorization (gasless)" },
            { n: "4", text: "Retry with X-PAYMENT header → data flows back" },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {n}
              </span>
              <p className="text-text-2 text-sm font-mono">{text}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setShowSnippet(true)} className="mt-5 text-cyan text-sm font-mono hover:underline">
          Get the SDK snippet →
        </button>
      </div>

      {/* Modals */}
      {showTest    && <TestCallModal feed={feed} onClose={() => setShowTest(false)} />}
      {showSnippet && <SnippetModal  feed={feed} onClose={() => setShowSnippet(false)} />}
      {showResult && result.status === "success" && (
        <PayResultModal
          feed={feed}
          result={result}
          onClose={() => { setShowResult(false); reset(); }}
          onPayAgain={() => {
            setShowResult(false);
            reset();
            setTimeout(() => handlePay(), 100);
          }}
        />
      )}
    </div>
  );
}