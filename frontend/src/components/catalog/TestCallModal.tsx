import { useState, useEffect } from "react";
import type { Feed } from "../../types";
import { LoadingSpinner } from "../shared/index";
import CopyButton from "../shared/CopyButton";
import apiClient from "../../api/client";

interface Props {
  feed: Feed;
  onClose: () => void;
}

interface TestResult {
  feedId: string;
  latencyMs: number;
  response: unknown;
  price: string;
  remaining: number;
  resetAt: number;
  note: string;
}

function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function isRateLimitError(msg: string): boolean {
  return msg.toLowerCase().includes("rate limit") || msg.includes("429");
}

export default function TestCallModal({ feed, onClose }: Props) {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRLError, setIsRLError] = useState(false);
  const [resetAt, setResetAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!isRLError || !resetAt) return;
    const tick = () => setCountdown(fmtCountdown(resetAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRLError, resetAt]);

  useEffect(() => {
    async function run() {
      try {
        const { data } = await apiClient.post<TestResult>(`/api/testcall/${feed.id}`);
        setResult(data);
      } catch (e: unknown) {
        const msg = (e as Error).message ?? "";
        if (isRateLimitError(msg)) {
          setIsRLError(true);
          const data = (e as any)?.response?.data;
          if (data?.resetAt) setResetAt(data.resetAt);
          else setResetAt(Date.now() + 3_600_000);
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [feed.id]);

  const responseStr = result ? JSON.stringify(result.response, null, 2) : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-widest mb-0.5">
              Free Preview
            </p>
            <h3 className="font-display font-semibold text-text-1">{feed.name}</h3>
          </div>
          <div className="flex items-center gap-3">
            {result && (
              <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${
                result.remaining > 1
                  ? "border-emerald/20 bg-emerald/5 text-emerald"
                  : result.remaining === 1
                    ? "border-amber/20 bg-amber/5 text-amber"
                    : "border-red/20 bg-red/5 text-red"
              }`}>
                {result.remaining} preview{result.remaining !== 1 ? "s" : ""} left
              </span>
            )}
            <button
              onClick={onClose}
              className="text-text-3 hover:text-text-1 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <LoadingSpinner size="md" />
              <p className="text-text-2 text-sm font-mono">Calling upstream API...</p>
            </div>
          )}

          {isRLError && resetAt && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏱</span>
              </div>
              <h4 className="font-display font-semibold text-text-1 mb-2">
                Free preview limit reached
              </h4>
              <p className="text-text-2 text-sm mb-4">
                3 free previews per hour per feed. Resets in:
              </p>
              <div className="inline-flex items-center gap-2 bg-amber/10 border border-amber/20 rounded-xl px-5 py-3 mb-4">
                <span className="font-mono text-amber text-xl font-bold">{countdown}</span>
              </div>
              <p className="text-text-3 text-xs font-mono">
                Connect your wallet to make unlimited paid calls — no preview limit applies.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 flex items-start gap-3">
              <span className="text-red mt-0.5 shrink-0">⚠</span>
              <div>
                <p className="text-red text-sm font-mono font-semibold mb-1">Upstream error</p>
                <p className="text-text-2 text-xs font-mono">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-emerald bg-emerald/10 border border-emerald/20 px-2 py-1 rounded-md">
                  200 OK
                </span>
                <span className="text-text-2">
                  <span className="text-text-3">latency </span>{result.latencyMs}ms
                </span>
                <span className="text-text-2">
                  <span className="text-text-3">price </span>{result.price}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-3 text-[10px] font-mono uppercase tracking-widest">Response</p>
                  <CopyButton text={responseStr} />
                </div>
                <pre className="bg-bg border border-border rounded-xl p-4 text-sm text-cyan font-mono overflow-auto max-h-48 leading-relaxed text-wrap">
                  {responseStr}
                </pre>
              </div>

              <p className="text-text-3 text-xs font-mono bg-surface-2 border border-border rounded-lg p-3">
                {result.note}
              </p>
            </>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-border-2 text-text-2 hover:text-text-1 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}