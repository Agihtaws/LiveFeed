import { Router } from "express";
import { registry } from "../db/registry.js";
import { asyncWrap } from "../middleware/errorHandler.js";
import { NotFoundError } from "../shared/errors.js";
import type { PublicFeed } from "../shared/types.js";

const router = Router();

// ── GET /api/catalog ──
router.get(
  "/",
  asyncWrap(async (req, res) => {
    const { category, sort } = req.query as Record<string, string>;

    let feeds = registry.getAll().filter((f) => f.status === "active");

    if (category) {
      feeds = feeds.filter((f) => f.category === category);
    }

    const safeFeeds: PublicFeed[] = feeds.map(
      ({ upstreamUrl, ...rest }) => rest,
    );

    if (sort === "callCount") {
      safeFeeds.sort((a, b) => b.callCount - a.callCount);
    } else if (sort === "price") {
      safeFeeds.sort(
        (a, b) =>
          parseFloat(a.price.replace("$", "")) -
          parseFloat(b.price.replace("$", "")),
      );
    } else {
      // Default: newest first
      safeFeeds.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    res.json(safeFeeds);
  }),
);

// ── GET /api/catalog/categories  ← BEFORE /:id to avoid route conflict ──
router.get("/categories", (_req, res) => {
  res.json(registry.categoryCounts());
});

// ── GET /api/catalog/:id ──
router.get(
  "/:id",
  asyncWrap(async (req, res) => {
    const feed = registry.getById(req.params.id);
    if (!feed || feed.status !== "active") throw new NotFoundError("Feed");
    const { upstreamUrl, ...safe } = feed;
    res.json(safe);
  }),
);

export default router;