import type { Feed } from "../../types";
import type { PaymentResult } from "../../hooks/useX402Payment";
import CopyButton from "../shared/CopyButton";

interface Props {
  feed: Feed;
  result: PaymentResult;
  onClose: () => void;
  onPayAgain: () => void;
}

const BASESCAN_TX = "https://sepolia.basescan.org/tx/";

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export default function PayResultModal({ feed, result, onClose, onPayAgain }: Props) {
  const responseStr = result.data
    ? JSON.stringify(result.data, null, 2)
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center">
              <span className="text-emerald text-sm">✓</span>
            </div>
            <div>
              <p className="text-text-3 text-[10px] font-mono uppercase tracking-widest">
                Payment Confirmed
              </p>
              <h3 className="font-display font-semibold text-text-1">{feed.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text-1 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border bg-surface-2/50">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-4">
              <span>
                <span className="text-text-3">paid </span>
                <span className="text-cyan font-semibold">{result.paidAmount} USDC</span>
              </span>
              <span>
                <span className="text-text-3">latency </span>
                <span className="text-text-1">{result.latencyMs}ms</span>
              </span>
            </div>
            <span className="text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded">
              200 OK
            </span>
          </div>
        </div>

        {result.txHash ? (
          <div className="px-5 pt-4">
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-widest mb-2">
              On-chain Proof
            </p>
            <div className="flex items-center justify-between bg-emerald/5 border border-emerald/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald shrink-0 animate-pulse-slow" />
                <span className="font-mono text-xs text-emerald truncate">
                  {shortHash(result.txHash)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <CopyButton text={result.txHash} label="Copy" />
                <a
                  href={`${BASESCAN_TX}${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-3 py-1.5 rounded-lg border border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors"
                >
                  Basescan ↗
                </a>
              </div>
            </div>
            <p className="text-text-3 text-[10px] font-mono mt-1.5">
              USDC transfer verified on Base Sepolia · EIP-3009 gasless authorization
            </p>
          </div>
        ) : (
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-xl px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-text-3 shrink-0" />
              <p className="text-text-3 text-xs font-mono">
                Transaction hash pending — check Basescan for wallet{" "}
                <a
                  href={`https://sepolia.basescan.org/token/${import.meta.env.VITE_USDC_ADDRESS ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan hover:underline"
                >
                  USDC transfers ↗
                </a>
              </p>
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-text-3 text-[10px] font-mono uppercase tracking-widest">
              Response Data
            </p>
            <CopyButton text={responseStr} />
          </div>
          <pre className="bg-bg border border-border rounded-xl p-4 text-sm text-cyan font-mono overflow-auto max-h-48 leading-relaxed">
            {responseStr}
          </pre>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onPayAgain}
            className="flex-1 py-2.5 rounded-xl border border-cyan/30 bg-cyan/5 text-cyan text-sm font-medium hover:bg-cyan/15 transition-colors"
          >
            ▶ Pay & Call Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border-2 text-text-2 text-sm font-medium hover:text-text-1 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}