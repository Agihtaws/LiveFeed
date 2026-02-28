import { useState, useEffect } from "react";
import type { Feed, SnippetResult } from "../../types";
import { getSnippet } from "../../api/feeds";
import { LoadingSpinner, ErrorBanner } from "../shared/index";
import CopyButton from "../shared/CopyButton";

interface Props {
  feed:    Feed;
  onClose: () => void;
}

type Tab = "typescript" | "curl";

export default function SnippetModal({ feed, onClose }: Props) {
  const [snippet, setSnippet] = useState<SnippetResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<Tab>("typescript");

  useEffect(() => {
    getSnippet(feed.id)
      .then(setSnippet)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [feed.id]);

  const activeCode = tab === "typescript" ? (snippet?.typescript ?? "") : (snippet?.curlNote ?? "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-2xl animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-widest mb-0.5">SDK Snippet</p>
            <h3 className="font-display font-semibold text-text-1">{feed.name}</h3>
          </div>
          <button onClick={onClose} className="text-text-3 hover:text-text-1 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 transition-colors">
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border px-5 gap-1 pt-3">
          {(["typescript", "curl"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-mono rounded-t-lg border-b-2 transition-colors ${
                tab === t
                  ? "border-cyan text-cyan"
                  : "border-transparent text-text-3 hover:text-text-2"
              }`}
            >
              {t === "typescript" ? "TypeScript" : "cURL flow"}
            </button>
          ))}
        </div>

        {/* Code */}
        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          )}
          {error && <ErrorBanner message={error} />}
          {snippet && (
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red/60" />
                  <span className="w-2 h-2 rounded-full bg-amber/60" />
                  <span className="w-2 h-2 rounded-full bg-emerald/60" />
                </div>
                <CopyButton text={activeCode} />
              </div>
              <pre className="bg-bg border border-border rounded-xl p-4 text-xs text-text-2 font-mono overflow-auto max-h-72 leading-relaxed">
                <code className="text-cyan/90">{activeCode}</code>
              </pre>
            </div>
          )}

          {/* Install hint */}
          {snippet && (
            <div className="mt-4 p-3 bg-surface-2 border border-border rounded-lg">
              <p className="text-text-3 text-xs font-mono">
                <span className="text-violet">install</span>
                {"  "}
                npm install pinion-os
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}