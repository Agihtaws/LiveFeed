import type { FeedStatus } from "../../types";

// ── StatusBadge ───────────────────────────────────────────────
export function StatusBadge({ status }: { status: FeedStatus }) {
  return status === "active" ? (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-slow" />
      ACTIVE
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-amber">
      <span className="w-1.5 h-1.5 rounded-full bg-amber" />
      PAUSED
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────
interface StatCardProps {
  label:    string;
  value:    string | number;
  sub?:     string;
  accent?:  "cyan" | "violet" | "emerald";
  className?: string;
}

export function StatCard({ label, value, sub, accent = "cyan", className = "" }: StatCardProps) {
  const accentClass = {
    cyan:    "text-cyan",
    violet:  "text-violet",
    emerald: "text-emerald",
  }[accent];

  return (
    <div className={`card p-5 ${className}`}>
      <p className="text-text-2 text-xs font-mono uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${accentClass}`}>{value}</p>
      {sub && <p className="text-text-3 text-xs mt-1 font-mono">{sub}</p>}
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" }[size];
  return (
    <div className={`${s} rounded-full border-2 border-border-2 border-t-cyan animate-spin`} />
  );
}

// ── EmptyState ────────────────────────────────────────────────
interface EmptyStateProps {
  title:    string;
  message:  string;
  action?:  React.ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
        <span className="text-2xl">📡</span>
      </div>
      <h3 className="font-display text-xl font-semibold text-text-1 mb-2">{title}</h3>
      <p className="text-text-2 text-sm max-w-sm mb-6">{message}</p>
      {action}
    </div>
  );
}

// ── ErrorBanner ───────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 flex items-start gap-3">
      <span className="text-red mt-0.5">⚠</span>
      <p className="text-red text-sm font-mono">{message}</p>
    </div>
  );
}