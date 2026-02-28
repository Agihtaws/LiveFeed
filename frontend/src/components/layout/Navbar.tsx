import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain, useReadContract } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { formatUnits } from "viem";
import { USDC_ADDRESS, ERC20_ABI } from "../../lib/wagmi";

const NAV = [
  { to: "/catalog", label: "Catalog" },
  { to: "/provider", label: "Sell API" },
  { to: "/how-it-works", label: "How It Works" },
];

function UsdcBalance() {
  const { address } = useAccount();
  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  if (!address || balance === undefined) return null;

  const usdc = parseFloat(formatUnits(balance, 6)).toFixed(2);
  const isLow = parseFloat(usdc) < 0.01;

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-cyan bg-cyan/5 border border-cyan/20 px-3 py-1.5 rounded-full">
      <span className="text-text-3">USDC</span>
      {usdc}
      {isLow && (
        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber hover:text-amber/80 ml-0.5"
          title="Get testnet USDC from Circle faucet"
        >
          ⚠ low
        </a>
      )}
    </div>
  );
}

function WrongNetworkBanner() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === baseSepolia.id) return null;

  return (
    <div className="bg-amber/10 border-b border-amber/20 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-amber">⚠</span>
          <span className="text-text-2">
            Wrong network — LiveFeed requires{" "}
            <span className="text-amber font-semibold">Base Sepolia</span>.
            Payments will fail on other networks.
          </span>
        </div>
        <button
          onClick={() => switchChain({ chainId: baseSepolia.id })}
          disabled={isPending}
          className="shrink-0 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-amber text-bg hover:bg-amber/80 disabled:opacity-50 disabled:cursor-wait transition-colors"
        >
          {isPending ? "Switching..." : "Switch to Base Sepolia →"}
        </button>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { isConnected } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 group shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center group-hover:bg-cyan/20 transition-colors">
              <span className="text-cyan text-sm font-mono font-bold">LF</span>
            </div>
            <span className="font-display font-bold text-lg text-text-1 tracking-tight">
              Live<span className="text-cyan">Feed</span>
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? "bg-cyan/10 text-cyan"
                    : "text-text-2 hover:text-text-1 hover:bg-surface-2"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {!isConnected && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald bg-emerald/10 border border-emerald/20 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-slow" />
                base-sepolia
              </div>
            )}

            {isConnected && <UsdcBalance />}

            <ConnectButton
              label="Connect"
              accountStatus="avatar"
              chainStatus="icon"
              showBalance={false}
            />

            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-surface-2 transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-text-2 transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-text-2 transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-text-2 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-bg/95 backdrop-blur-md animate-fade-in">
            <nav className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1">
              {NAV.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? "bg-cyan/10 text-cyan"
                      : "text-text-2 hover:text-text-1 hover:bg-surface-2"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-slow" />
                Base Sepolia testnet
              </div>
            </nav>
          </div>
        )}
      </header>

      <WrongNetworkBanner />
    </>
  );
}