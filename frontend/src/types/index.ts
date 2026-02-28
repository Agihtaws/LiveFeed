export type FeedCategory = "sports" | "finance" | "weather" | "custom";
export type FeedStatus   = "active" | "paused";
export type HttpMethod   = "GET" | "POST";

export const VALID_CATEGORIES: FeedCategory[] = [
  "sports", "finance", "weather", "custom",
];


export interface Feed {
  id:                string;
  name:              string;
  description:       string;
  category:          FeedCategory;
  method:            HttpMethod;
  price:             string;       // "$0.01"
  providerAddress:   string;
  createdAt:         string;
  callCount:         number;
  totalEarnedAtomic: number;
  avgLatencyMs:      number;
  lastCalledAt:      string | null;
  status:            FeedStatus;
}

export interface ProviderFeed extends Feed {
  upstreamUrl: string;
}

export interface CategoryCounts {
  sports:  number;
  finance: number;
  weather: number;
  custom:  number;
}

export interface FeedStat {
  id:           string;
  name:         string;
  callCount:    number;
  earnedUsdc:   string;
  avgLatencyMs: number;
  lastCalledAt: string | null;
  status:       FeedStatus;
}

export interface ProviderStats {
  providerAddress: string;
  walletBalance:   { ETH: string; USDC: string };
  totalCalls:      number;
  totalEarnedUsdc: string;
  feeds:           FeedStat[];
}

export interface PublicFeedStats {
  id:           string;
  name:         string;
  category:     FeedCategory;
  price:        string;
  callCount:    number;
  earnedUsdc:   string;
  avgLatencyMs: number;
  lastCalledAt: string | null;
  status:       FeedStatus;
  createdAt:    string;
}

export interface TestCallResult {
  feedId:    string;
  latencyMs: number;
  response:  unknown;
  price:     string;
  note:      string;
}

export interface SnippetResult {
  feedId:    string;
  name:      string;
  price:     string;
  method:    HttpMethod;
  typescript: string;
  curlNote:  string;
}

export interface RegisterFeedPayload {
  name:            string;
  description:     string;
  category:        FeedCategory;
  upstreamUrl:     string;
  method:          HttpMethod;
  price:           string;
  providerAddress: string;
}

export interface HealthResponse {
  status:      string;
  network:     string;
  platform:    string;
  feedsLoaded: number;
  uptime:      number;
}