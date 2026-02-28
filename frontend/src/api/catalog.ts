import apiClient from "./client";
import type { Feed, CategoryCounts } from "../types";

export async function getCatalog(params?: {
  category?: string;
  sort?: "callCount" | "price";
}): Promise<Feed[]> {
  const res = await apiClient.get<Feed[]>("/api/catalog", { params });
  return res.data;
}

export async function getFeedById(id: string): Promise<Feed> {
  const res = await apiClient.get<Feed>(`/api/catalog/${id}`);
  return res.data;
}

export async function getCategoryCounts(): Promise<CategoryCounts> {
  const res = await apiClient.get<CategoryCounts>("/api/catalog/categories");
  return res.data;
}

export async function getHealth() {
  const res = await apiClient.get("/health");
  return res.data;
}