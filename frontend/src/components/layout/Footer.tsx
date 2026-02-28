import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan/10 border border-cyan/30 flex items-center justify-center">
            <span className="text-cyan text-[10px] font-mono font-bold">LF</span>
          </div>
          <span className="font-display text-sm font-semibold text-text-2">
            Live<span className="text-cyan">Feed</span>
          </span>
          <span className="text-text-3 text-xs ml-2 font-mono">x402 micropayments on Base Sepolia</span>
        </div>
        <nav className="flex items-center gap-6 text-xs font-mono text-text-3">
          <Link to="/catalog"      className="hover:text-text-2 transition-colors">Catalog</Link>
          <Link to="/provider"     className="hover:text-text-2 transition-colors">Sell API</Link>
          <Link to="/how-it-works" className="hover:text-text-2 transition-colors">How It Works</Link>
        </nav>
      </div>
    </footer>
  );
}