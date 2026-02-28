import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { RegisterFeedPayload, FeedCategory, HttpMethod } from "../../types";
import { registerFeed } from "../../api/provider";
import { VALID_CATEGORIES } from "../../types";
import { ErrorBanner } from "../shared/index";
import { useToast } from "../shared/Toast";

interface Props {
  onSuccess: () => void;
}

const INITIAL: RegisterFeedPayload = {
  name: "",
  description: "",
  category: "finance",
  upstreamUrl: "",
  method: "GET",
  price: "0.01",
  providerAddress: "",
};

export default function RegisterFeedForm({ onSuccess }: Props) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { toast } = useToast();

  const [form, setForm] = useState<RegisterFeedPayload>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      setForm((f) => ({ ...f, providerAddress: address }));
    } else {
      setForm((f) => ({ ...f, providerAddress: "" }));
    }
  }, [address]);

  const set = (k: keyof RegisterFeedPayload, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await registerFeed({ ...form, providerAddress: address });
      setForm({ ...INITIAL, providerAddress: address });
      toast.success(`"${form.name}" registered — switching to My Feeds`);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text-1
    placeholder-text-3 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20
    transition-colors
  `;

  const labelClass = "block text-xs font-mono text-text-2 uppercase tracking-widest mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Feed Name *</label>
          <input
            className={inputClass}
            placeholder="e.g. BTC Price Feed"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Category *</label>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => set("category", e.target.value as FeedCategory)}
          >
            {VALID_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          className={`${inputClass} resize-none h-20`}
          placeholder="What data does this feed provide?"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Upstream API URL *</label>
        <input
          className={inputClass}
          type="url"
          placeholder="https://api.example.com/data"
          value={form.upstreamUrl}
          onChange={(e) => set("upstreamUrl", e.target.value)}
          required
        />
        <p className="text-text-3 text-[11px] font-mono mt-1">This URL is never exposed publicly</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Method *</label>
          <div className="flex gap-2">
            {(["GET", "POST"] as HttpMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set("method", m)}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                  form.method === m
                    ? "border-cyan/40 bg-cyan/10 text-cyan"
                    : "border-border bg-bg text-text-3 hover:text-text-2 hover:border-border-2"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Price (USDC) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 font-mono text-sm">$</span>
            <input
              className={`${inputClass} pl-7`}
              type="number"
              min="0.001"
              step="0.001"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Your Wallet *
            {isConnected && (
              <span className="ml-2 text-emerald normal-case tracking-normal">
                ✓ auto-filled
              </span>
            )}
          </label>
          {isConnected ? (
            <div className="relative">
              <input
                className={`${inputClass} pr-10 text-emerald border-emerald/20 bg-emerald/5 cursor-not-allowed`}
                value={form.providerAddress}
                readOnly
                title="Auto-filled from connected wallet"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald text-xs">✓</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={openConnectModal}
              className="w-full py-2.5 rounded-lg border border-cyan/30 bg-cyan/5 text-cyan text-xs font-mono hover:bg-cyan/15 transition-colors"
            >
              🔗 Connect wallet to auto-fill
            </button>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !isConnected}
        className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
          loading
            ? "bg-cyan/30 text-bg cursor-not-allowed"
            : !isConnected
              ? "bg-surface-2 border border-border-2 text-text-3 cursor-not-allowed"
              : "bg-cyan text-bg hover:bg-cyan-hover active:scale-[0.98]"
        }`}
      >
        {loading
          ? "Registering..."
          : !isConnected
            ? "Connect wallet to register"
            : "Register Feed →"
        }
      </button>
    </form>
  );
}