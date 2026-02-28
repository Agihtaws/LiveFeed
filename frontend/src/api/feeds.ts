import apiClient from "./client";
import type { TestCallResult, ProviderStats, PublicFeedStats, SnippetResult } from "../types";

// ── Test call (free preview) ──────────────────────────────────
export async function testCall(feedId: string): Promise<TestCallResult> {
  const res = await apiClient.post<TestCallResult>(`/api/testcall/${feedId}`);
  return res.data;
}

// ── Stats ─────────────────────────────────────────────────────
export async function getProviderStats(address: string): Promise<ProviderStats> {
  const res = await apiClient.get<ProviderStats>(`/api/stats/${address}`);
  return res.data;
}

export async function getFeedStats(feedId: string): Promise<PublicFeedStats> {
  const res = await apiClient.get<PublicFeedStats>(`/api/stats/feed/${feedId}`);
  return res.data;
}

// ── Snippet ───────────────────────────────────────────────────
export async function getSnippet(feedId: string): Promise<SnippetResult> {
  const res = await apiClient.get<SnippetResult>(`/api/snippet/${feedId}`);
  return res.data;
}