import { useState } from "react";
import type { ProviderFeed } from "../../types";
import { toggleFeedPause, deleteFeed } from "../../api/provider";
import CategoryBadge from "../shared/CategoryBadge";
import { StatusBadge } from "../shared/index";
import CopyButton from "../shared/CopyButton";

interface Props {
  feeds: ProviderFeed[];
  onRefresh: () => void;
}

export default function MyFeedsTable({ feeds, onRefresh }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (feed: ProviderFeed) => {
    setError(null);
    setLoadingId(feed.id);
    try {
      await toggleFeedPause(feed.id, feed.providerAddress);
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (feed: ProviderFeed) => {
    if (!confirm(`Delete "${feed.name}"? This cannot be undone.`)) return;
    setError(null);
    setLoadingId(feed.id);
    try {
      await deleteFeed(feed.id, feed.providerAddress);
      onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  if (!feeds.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-text-3 font-mono text-sm">No feeds registered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 flex items-start gap-3">
          <span className="text-red mt-0.5">⚠</span>
          <p className="text-red text-sm font-mono">{error}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Feed", "Category", "Price", "Calls", "Earned", "Latency", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-mono text-text-3 uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feeds.map((feed, i) => (
                <tr
                  key={feed.id}
                  className={`border-b border-border/50 hover:bg-surface-2/50 transition-colors ${
                    i === feeds.length - 1 ? "border-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text-1 whitespace-nowrap">{feed.name}</p>
                      <p className="text-text-3 text-[11px] font-mono truncate max-w-[180px]">
                        {feed.id}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge category={feed.category} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-cyan font-medium">{feed.price}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-text-1">{feed.callCount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald">
                      ${(feed.totalEarnedAtomic / 1e6).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-text-2">
                      {feed.avgLatencyMs === 0 ? "—" : `${feed.avgLatencyMs}ms`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={feed.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <CopyButton text={feed.id} label="ID" />
                      <button
                        onClick={() => handleToggle(feed)}
                        disabled={loadingId === feed.id}
                        className={`text-[11px] font-mono px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          feed.status === "active"
                            ? "border-amber/30 bg-amber/5 text-amber hover:bg-amber/15"
                            : "border-emerald/30 bg-emerald/5 text-emerald hover:bg-emerald/15"
                        }`}
                      >
                        {loadingId === feed.id
                          ? "..."
                          : feed.status === "active" ? "Pause" : "Resume"
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(feed)}
                        disabled={loadingId === feed.id}
                        className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-red/20 bg-red/5 text-red hover:bg-red/15 transition-colors disabled:opacity-50"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}