import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery } from "@tanstack/react-query";
import RegisterFeedForm from "../components/provider/RegisterFeedForm";
import MyFeedsTable from "../components/provider/MyFeedsTable";
import { getProviderFeeds } from "../api/provider";
import { getProviderStats } from "../api/feeds";
import { StatCard, LoadingSpinner, ErrorBanner } from "../components/shared/index";

function isValidAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export default function Provider() {
  const { address: connectedAddress, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [manualAddress, setManualAddress] = useState("");
  const [inputVal,      setInputVal]      = useState("");
  const [activeTab,     setActiveTab]     = useState<"register" | "dashboard">("register");
  const address = connectedAddress ?? manualAddress;

  // When wallet connects — auto-switch to dashboard and clear manual input
  useEffect(() => {
    if (connectedAddress) {
      setManualAddress("");
      setInputVal("");
      setActiveTab("dashboard");
    }
  }, [connectedAddress]);

  const {
    data: feeds = [],
    isLoading: feedsLoading,
    error: feedsError,
    refetch: refetchFeeds,
  } = useQuery({
    queryKey:        ["provider-feeds", address],
    queryFn:         () => getProviderFeeds(address),
    enabled:         isValidAddress(address),
    staleTime:       10_000,
    refetchInterval: 20_000,
  });

  const { data: stats } = useQuery({
    queryKey:        ["provider-stats", address],
    queryFn:         () => getProviderStats(address),
    enabled:         isValidAddress(address),
    staleTime:       15_000,
    refetchInterval: 30_000,
  });

  const handleManualLookup = () => {
    if (isValidAddress(inputVal)) {
      setManualAddress(inputVal.trim());
    }
  };

  // Source label shown in the wallet card
  const addressSource = connectedAddress
    ? "Connected wallet"
    : manualAddress
      ? "Manual lookup"
      : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <h1 className="font-display text-4xl font-bold text-text-1 mb-2">Provider Dashboard</h1>
        <p className="text-text-2">Register your API as a paid feed and earn USDC per call.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8 animate-fade-up stagger-1">
        {([
          { id: "register",  label: "Register Feed" },
          { id: "dashboard", label: "My Feeds" },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? "border-cyan text-cyan"
                : "border-transparent text-text-3 hover:text-text-2"
            }`}
          >
            {label}
            {/* Badge on My Feeds tab shows feed count when loaded */}
            {id === "dashboard" && feeds.length > 0 && (
              <span className="ml-2 text-[10px] font-mono bg-cyan/10 text-cyan px-1.5 py-0.5 rounded-full">
                {feeds.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Register tab ──────────────────────────────────────────────────── */}
      {activeTab === "register" && (
        <div className="max-w-2xl animate-fade-up">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-text-1 mb-1">
              Register a new feed
            </h2>
            <p className="text-text-2 text-sm mb-6">
              Wrap any upstream API URL. Consumers pay{" "}
              <span className="text-cyan font-mono">$0.01</span> USDC per call.
              Your wallet receives credit tracked in the platform.
            </p>
            <RegisterFeedForm
              onSuccess={() => {
                // After registering, switch to dashboard and refresh
                setActiveTab("dashboard");
                if (isValidAddress(address)) refetchFeeds();
              }}
            />
          </div>
        </div>
      )}

      {/* ── Dashboard tab ─────────────────────────────────────────────────── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-fade-up">

          {/* Wallet card — auto-filled if connected, manual fallback if not */}
          <div className="card p-5">
            {isConnected && connectedAddress ? (
              // ── Connected — show address read-only with auto badge ──
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-text-3 text-xs font-mono uppercase tracking-widest">
                    Connected Wallet
                  </p>
                  <span className="text-emerald text-[10px] font-mono bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">
                    ✓ auto-loaded
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-bg border border-emerald/20 rounded-xl px-4 py-2.5 font-mono text-sm text-emerald truncate">
                    {connectedAddress}
                  </div>
                  <button
                    onClick={() => refetchFeeds()}
                    className="px-4 py-2.5 border border-border-2 text-text-2 text-xs font-mono rounded-xl hover:text-text-1 transition-colors"
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>
            ) : (
              // ── Not connected — two options: connect wallet or manual input ──
              <div className="space-y-4">
                {/* Connect wallet CTA */}
                <div>
                  <p className="text-text-3 text-xs font-mono uppercase tracking-widest mb-3">
                    Your Wallet
                  </p>
                  <button
                    onClick={openConnectModal}
                    className="w-full py-3 rounded-xl border border-cyan/30 bg-cyan/5 text-cyan text-sm font-medium hover:bg-cyan/15 transition-colors"
                  >
                    🔗 Connect wallet to auto-load your feeds
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-text-3 text-xs font-mono">or look up manually</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Manual address input */}
                <div className="flex gap-3">
                  <input
                    className="flex-1 bg-bg border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-text-1 placeholder-text-3 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 transition-colors"
                    placeholder="0x..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
                  />
                  <button
                    onClick={handleManualLookup}
                    disabled={!isValidAddress(inputVal)}
                    className="px-6 py-2.5 bg-cyan text-bg text-sm font-semibold rounded-xl hover:bg-cyan-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Look up →
                  </button>
                </div>
                {inputVal && !isValidAddress(inputVal) && (
                  <p className="text-red text-xs font-mono">
                    Must be a valid 0x Ethereum address
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stats summary */}
          {stats && isValidAddress(address) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Calls"  value={stats.totalCalls.toLocaleString()} accent="cyan"    className="animate-fade-up stagger-1" />
              <StatCard label="USDC Earned"  value={`$${stats.totalEarnedUsdc}`}        accent="emerald" className="animate-fade-up stagger-2" />
              <StatCard label="ETH Balance"  value={stats.walletBalance?.ETH ?? "—"}    accent="violet"  className="animate-fade-up stagger-3" />
              <StatCard label="USDC Balance" value={stats.walletBalance?.USDC ?? "—"}   accent="cyan"    className="animate-fade-up stagger-4" />
            </div>
          )}

          {/* Feeds table */}
          {isValidAddress(address) ? (
            <>
              {feedsError && <ErrorBanner message={(feedsError as Error).message} />}
              {feedsLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-display font-semibold text-text-1">
                        {feeds.length} Feed{feeds.length !== 1 ? "s" : ""}
                      </h2>
                      {addressSource && (
                        <p className="text-text-3 text-xs font-mono mt-0.5">{addressSource}</p>
                      )}
                    </div>
                    <button
                      onClick={() => refetchFeeds()}
                      className="text-xs font-mono text-text-3 hover:text-text-2 transition-colors"
                    >
                      ↻ Refresh
                    </button>
                  </div>
                  <MyFeedsTable feeds={feeds} onRefresh={refetchFeeds} />
                </div>
              )}
            </>
          ) : (
            // No address yet — prompt
            <div className="card p-12 text-center">
              <p className="text-text-3 font-mono text-sm">
                {isConnected
                  ? "Loading your feeds..."
                  : "Connect your wallet or enter an address above to see feeds"
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}