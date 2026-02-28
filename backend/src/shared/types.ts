export type FeedCategory = "sports" | "finance" | "weather" | "custom";
export type FeedStatus = "active" | "paused";
export type HttpMethod = "GET" | "POST";

export const VALID_CATEGORIES: FeedCategory[] = [
  "sports",
  "finance",
  "weather",
  "custom",
];

export interface Feed {
  id: string;
  name: string;
  description: string;
  category: FeedCategory;
  upstreamUrl: string;
  method: HttpMethod;
  price: string;
  providerAddress: string;
  createdAt: string;
  callCount: number;
  totalEarnedAtomic: number;
  avgLatencyMs: number;
  lastCalledAt: string | null;
  status: FeedStatus;
}

export type PublicFeed = Omit<Feed, "upstreamUrl">;

export interface RegisterFeedPayload {
  name: string;
  description: string;
  category: FeedCategory;
  upstreamUrl: string;
  method: HttpMethod;
  price: string;
  providerAddress: string;
}

export interface ProviderStats {
  providerAddress: string;
  walletBalance: { ETH: string; USDC: string };
  totalCalls: number;
  totalEarnedUsdc: string;
  feeds: FeedStat[];
}

export interface FeedStat {
  id: string;
  name: string;
  callCount: number;
  earnedUsdc: string;
  avgLatencyMs: number;
  lastCalledAt: string | null;
  status: FeedStatus;
}

export interface TestCallResult {
  feedId: string;
  latencyMs: number;
  response: any;
  price: string;
  note: string;
}

export interface SnippetResult {
  feedId: string;
  name: string;
  price: string;
  typescript: string;
  curlNote: string;
}