import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCatalog, getCategoryCounts } from "../api/catalog";
import type { FeedCategory } from "../types";
import FeedCard from "../components/catalog/FeedCard";
import { LoadingSpinner, EmptyState, ErrorBanner } from "../components/shared/index";

const CATS = [
  { value: "",        label: "All"     },
  { value: "finance", label: "Finance" },
  { value: "sports",  label: "Sports"  },
  { value: "weather", label: "Weather" },
  { value: "custom",  label: "Custom"  },
];

type SortKey = "newest" | "callCount" | "price";

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [sort, setSort] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setCategory(cat);
  }, []);

  const { data: feeds = [], isLoading, error } = useQuery({
    queryKey: ["catalog", category],
    queryFn: () => getCatalog({ category: category || undefined }),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const { data: counts } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoryCounts,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const filtered = useMemo(() => {
    let list = [...feeds];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q),
      );
    }
    if (sort === "callCount") list.sort((a, b) => b.callCount - a.callCount);
    else if (sort === "price") list.sort((a, b) => parseFloat(a.price.replace("$", "")) - parseFloat(b.price.replace("$", "")));
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [feeds, search, sort]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-1 mb-2">Feed Catalog</h1>
          <p className="text-text-2">
            {feeds.length} active feed{feeds.length !== 1 ? "s" : ""} · pay per call with USDC on Base Sepolia
          </p>
        </div>
        <Link
          to="/provider"
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-cyan text-bg text-sm font-semibold rounded-xl hover:bg-cyan-hover transition-colors"
        >
          + Sell Your API
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-8 animate-fade-up stagger-1">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-sm">🔍</span>
          <input
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono text-text-1 placeholder-text-3 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 transition-colors"
            placeholder="Search feeds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-text-2 focus:outline-none focus:border-cyan/50 transition-colors"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="newest">Newest first</option>
          <option value="callCount">Most called</option>
          <option value="price">Lowest price</option>
        </select>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 mb-8 animate-fade-up stagger-2">
        {CATS.map(({ value, label }) => {
          const count = value === "" ? feeds.length : (counts?.[value as FeedCategory] ?? 0);
          return (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${category === value
                  ? "bg-cyan/10 text-cyan border border-cyan/30"
                  : "text-text-2 hover:text-text-1 hover:bg-surface-2 border border-transparent"
                }
              `}
            >
              {label}
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                category === value ? "bg-cyan/20 text-cyan" : "bg-surface-2 text-text-3"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {!isLoading && feeds.length > 0 && (
        <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 mb-6 animate-fade-up stagger-3">
          <span className="text-cyan text-sm">💡</span>
          <p className="text-text-2 text-xs font-mono">
            Connect your wallet via the top-right button to make paid calls.
            Free previews work without a wallet.
            Get testnet USDC at{" "}
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">
              faucet.circle.com
            </a>
          </p>
        </div>
      )}

      {error && <ErrorBanner message={(error as Error).message} />}

      {isLoading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!isLoading && !error && (
        filtered.length === 0 ? (
          <EmptyState
            title="No feeds found"
            message={search ? `No results for "${search}"` : "Be the first to register a feed in this category."}
            action={
              <Link to="/provider" className="px-6 py-2.5 bg-cyan text-bg text-sm font-semibold rounded-xl hover:bg-cyan-hover transition-colors">
                Register a Feed
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((feed, i) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                onPaymentSuccess={invalidateCatalog}
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}