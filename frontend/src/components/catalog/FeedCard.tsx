import { useState } from "react";
import { Link } from "react-router-dom";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { Feed } from "../../types";
import { useX402Payment } from "../../hooks/useX402Payment";
import CategoryBadge from "../shared/CategoryBadge";
import { StatusBadge } from "../shared/index";
import TestCallModal from "./TestCallModal";
import SnippetModal from "./SnippetModal";
import PayResultModal from "./PayResultModal";

interface Props {
  feed: Feed;
  onPaymentSuccess?: () => void;
  style?: React.CSSProperties;
}

function formatLatency(ms: number) {
  return ms === 0 ? "—" : `${ms}ms`;
}

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

const PAY_LABELS: Record<string, string> = {
  fetching: "Fetching...",
  signing: "Sign in wallet...",
  paying: "Verifying...",
  idle: "",
};

export default function FeedCard({ feed, onPaymentSuccess, style }: Props) {
  const [showTest, setShowTest] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const { pay, reset, result, isConnected } = useX402Payment();
  const { openConnectModal } = useConnectModal();

  const isBusy = ["fetching", "signing", "paying"].includes(result.status);

  const handlePay = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    reset();
    setShowResult(false);
    await pay(feed);
    setShowResult(true);
    onPaymentSuccess?.();
  };

  const handlePayAgain = () => {
    setShowResult(false);
    reset();
    setTimeout(() => handlePay(), 100);
  };

  return (
    <>
      <div className="card p-5 flex flex-col gap-4 animate-fade-up" style={style}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <CategoryBadge category={feed.category} />
              <StatusBadge status={feed.status} />
            </div>
            <Link
              to={`/feed/${feed.id}`}
              className="font-display font-semibold text-text-1 hover:text-cyan transition-colors line-clamp-1 block"
            >
              {feed.name}
            </Link>
            <p className="text-text-2 text-xs mt-0.5 line-clamp-2 leading-relaxed">
              {feed.description}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono font-semibold text-cyan text-sm">{feed.price}</p>
            <p className="text-text-3 text-[10px] font-mono">per call</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
          <div>
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-wider">Calls</p>
            <p className="font-mono text-sm font-medium text-text-1 mt-0.5">{feed.callCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-wider">Latency</p>
            <p className="font-mono text-sm font-medium text-text-1 mt-0.5">{formatLatency(feed.avgLatencyMs)}</p>
          </div>
          <div>
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-wider">Last Call</p>
            <p className="font-mono text-sm font-medium text-text-1 mt-0.5">{timeAgo(feed.lastCalledAt)}</p>
          </div>
        </div>

        {result.status === "error" && result.error && (
          <div className="text-xs font-mono text-red bg-red/5 border border-red/20 rounded-lg px-3 py-2">
            {result.error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handlePay}
            disabled={isBusy || feed.status !== "active"}
            className={`
              flex-1 text-xs font-medium py-2.5 rounded-lg border transition-all
              ${isBusy
                ? "border-violet/30 bg-violet/5 text-violet cursor-wait"
                : feed.status !== "active"
                  ? "border-border bg-surface-2 text-text-3 cursor-not-allowed"
                  : isConnected
                    ? "border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20 hover:border-cyan/60"
                    : "border-border-2 bg-surface-2 text-text-2 hover:text-cyan hover:border-cyan/30"
              }
            `}
          >
            {isBusy
              ? PAY_LABELS[result.status] ?? "..."
              : isConnected
                ? `💳 Pay ${feed.price} & Call`
                : "🔗 Connect to Pay"
            }
          </button>

          <button
            onClick={() => setShowTest(true)}
            className="px-3 py-2.5 text-xs font-medium rounded-lg border border-border-2 bg-surface-2 text-text-2 hover:text-text-1 hover:border-border-2 transition-all"
            title="Free preview"
          >
            ▶
          </button>

          <button
            onClick={() => setShowSnippet(true)}
            className="px-3 py-2.5 text-xs font-medium rounded-lg border border-border-2 bg-surface-2 text-text-2 hover:text-text-1 transition-all"
            title="Get SDK snippet"
          >
            {"</>"}
          </button>

          <Link
            to={`/feed/${feed.id}`}
            className="px-3 py-2.5 text-xs font-medium rounded-lg border border-border-2 bg-surface-2 text-text-2 hover:text-text-1 transition-all"
            title="View details"
          >
            →
          </Link>
        </div>
      </div>

      {showTest && <TestCallModal feed={feed} onClose={() => setShowTest(false)} />}
      {showSnippet && <SnippetModal feed={feed} onClose={() => setShowSnippet(false)} />}
      {showResult && result.status === "success" && (
        <PayResultModal
          feed={feed}
          result={result}
          onClose={() => { setShowResult(false); reset(); }}
          onPayAgain={handlePayAgain}
        />
      )}
    </>
  );
}