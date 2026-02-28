import apiClient from "./client";
import type { ProviderFeed, RegisterFeedPayload } from "../types";

export async function registerFeed(payload: RegisterFeedPayload): Promise<ProviderFeed> {
  const res = await apiClient.post<ProviderFeed>("/api/provider/register", payload);
  return res.data;
}

export async function getProviderFeeds(address: string): Promise<ProviderFeed[]> {
  const res = await apiClient.get<ProviderFeed[]>(`/api/provider/${address}/feeds`);
  return res.data;
}

export async function toggleFeedPause(
  id: string,
  providerAddress: string,
): Promise<{ id: string; status: string }> {
  const res = await apiClient.put(`/api/provider/feed/${id}/pause`, { providerAddress });
  return res.data;
}

export async function deleteFeed(id: string, providerAddress: string): Promise<void> {
  
  await apiClient.delete(`/api/provider/feed/${id}`, { data: { providerAddress } });
}