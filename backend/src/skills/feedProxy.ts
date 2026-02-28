import type { Request, Response } from "express";
import { registry } from "../db/registry.js";

function priceToAtomic(priceStr: string): number {
  const num = parseFloat(priceStr.replace("$", ""));
  return Math.round(num * 1e6);
}

export async function feedProxyHandler(req: Request, res: Response): Promise<void> {
  const { feedId } = req.params;
  const feed = registry.getById(feedId);

  if (!feed) {
    res.status(404).json({ error: "Feed not found" });
    return;
  }

  if (feed.status !== "active") {
    res.status(503).json({ error: "Feed is paused" });
    return;
  }

  const start = Date.now();

  try {
    const url = new URL(feed.upstreamUrl);
    if (feed.method === "GET") {
      for (const [key, value] of Object.entries(req.query)) {
        url.searchParams.append(key, String(value));
      }
    }

    const fetchOptions: RequestInit = { method: feed.method };
    if (
      feed.method === "POST" &&
      req.body &&
      Object.keys(req.body as object).length
    ) {
      fetchOptions.body = JSON.stringify(req.body);
      fetchOptions.headers = { "Content-Type": "application/json" };
    }

    const upstream = await fetch(url.toString(), fetchOptions);
    const latencyMs = Date.now() - start;

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream returned error", upstreamStatus: upstream.status });
      return;
    }

    const data = await upstream.json();

    registry
      .updateStats(feedId, latencyMs, priceToAtomic(feed.price))
      .catch((err) => console.warn("[proxy] stats update failed:", err));

    res.setHeader("X-LiveFeed-Id", feedId);
    res.setHeader("X-LiveFeed-Latency-Ms", String(latencyMs));
    res.setHeader("X-LiveFeed-Price", feed.price);

    res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error(`[proxy] upstream fetch failed for feed ${feedId}:`, msg);
    res.status(502).json({ error: "Upstream fetch failed", details: msg });
  }
}