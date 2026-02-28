import { Router }    from "express";
import fs            from "fs/promises";
import path          from "path";
import { fileURLToPath } from "url";
import { registry }  from "../db/registry.js";
import { asyncWrap } from "../middleware/errorHandler.js";
import { NotFoundError, RateLimitError, UpstreamError } from "../shared/errors.js";

const router = Router();

// ── Rate limit persistence ────────────────────────────────────────────────

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const RL_FILE    = path.join(__dirname, "../../data/ratelimit.json");
const RL_TEMP    = RL_FILE + ".tmp";

const MAX_FREE_CALLS = 3;
const WINDOW_MS      = 60 * 60 * 1000; // 1 hour

interface RateEntry {
  count:   number;
  resetAt: number; // epoch ms
}


let rlMap: Map<string, RateEntry> = new Map();
let rlDirty = false;

// Load from disk on first use
let rlLoaded = false;
async function ensureRLLoaded(): Promise<void> {
  if (rlLoaded) return;
  rlLoaded = true;
  try {
    const raw = await fs.readFile(RL_FILE, "utf-8");
    const obj = JSON.parse(raw) as Record<string, RateEntry>;
    const now = Date.now();
    // Only load entries whose window hasn't expired — prunes stale entries on startup
    for (const [key, entry] of Object.entries(obj)) {
      if (entry.resetAt > now) rlMap.set(key, entry);
    }
    console.log(`[ratelimit] loaded ${rlMap.size} active rate limit entries from disk`);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[ratelimit] could not parse ratelimit.json — starting fresh", err);
    }
  }
}

// Debounced atomic write — batch multiple writes within 2s into one disk write
// Prevents hammering disk on rapid successive test calls
let rlFlushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRLFlush(): void {
  rlDirty = true;
  if (rlFlushTimer) return; // already scheduled
  rlFlushTimer = setTimeout(async () => {
    rlFlushTimer = null;
    if (!rlDirty) return;
    rlDirty = false;
    try {
      const now  = Date.now();
      // Only persist non-expired entries — keeps the file small
      const obj: Record<string, RateEntry> = {};
      for (const [key, entry] of rlMap.entries()) {
        if (entry.resetAt > now) obj[key] = entry;
      }
      await fs.mkdir(path.dirname(RL_FILE), { recursive: true });
      await fs.writeFile(RL_TEMP, JSON.stringify(obj, null, 2), "utf-8");
      await fs.rename(RL_TEMP, RL_FILE); // atomic rename, same as registry
    } catch (err) {
      console.warn("[ratelimit] failed to persist rate limit state:", err);
    }
  }, 2_000);
}

// ── Rate limit check ──────────────────────────────────────────────────────

async function checkRateLimit(key: string): Promise<void> {
  await ensureRLLoaded();
  const now   = Date.now();
  const entry = rlMap.get(key);

  if (!entry || now >= entry.resetAt) {
    rlMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    scheduleRLFlush();
    return;
  }

  if (entry.count >= MAX_FREE_CALLS) {
    // Don't bump count — just throw. Include resetAt for frontend countdown.
    const err = new RateLimitError();
    (err as RateLimitError & { resetAt: number }).resetAt = entry.resetAt;
    throw err;
  }

  entry.count += 1;
  scheduleRLFlush();
}

// ── POST /api/testcall/:feedId ────────────────────────────────────────────

router.post(
  "/:feedId",
  asyncWrap(async (req, res) => {
    const { feedId } = req.params;
    const ip  = req.ip ?? req.socket?.remoteAddress ?? "unknown";
    const key = `${feedId}:${ip}`;

    await checkRateLimit(key);

    const feed = registry.getById(feedId);
    if (!feed || feed.status !== "active") throw new NotFoundError("Feed");

    const start = Date.now();
    try {
      const fetchOptions: RequestInit = { method: feed.method };
      if (feed.method === "POST" && req.body && Object.keys(req.body).length) {
        fetchOptions.body    = JSON.stringify(req.body);
        fetchOptions.headers = { "Content-Type": "application/json" };
      }

      const upstream = await fetch(feed.upstreamUrl, fetchOptions);
      const latency  = Date.now() - start;

      if (!upstream.ok) throw new UpstreamError(`status ${upstream.status}`);

      const data = await upstream.json();

      // Include resetAt so the frontend can show an accurate countdown
      const rlEntry  = rlMap.get(key);
      const resetAt  = rlEntry?.resetAt ?? Date.now() + WINDOW_MS;
      const remaining = Math.max(0, MAX_FREE_CALLS - (rlEntry?.count ?? 1));

      res.json({
        feedId,
        latencyMs:  latency,
        response:   data,
        price:      feed.price,
        remaining,
        resetAt,
        note: `Free preview (${remaining} of ${MAX_FREE_CALLS} remaining this hour). Real calls cost ${feed.price} USDC via x402.`,
      });
    } catch (err) {
      if (err instanceof UpstreamError) throw err;
      throw new UpstreamError((err as Error).message);
    }
  }),
);

export default router;