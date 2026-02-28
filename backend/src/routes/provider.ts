import { Router } from "express";
import { registry } from "../db/registry.js";
import { asyncWrap } from "../middleware/errorHandler.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";
import {
  assertRequired,
  assertEthAddress,
  assertHttpUrl,
  assertCategory,
  assertMethod,
  assertPrice,
  normalisePrice,
} from "../shared/validate.js";
import type { RegisterFeedPayload } from "../shared/types.js";

const router = Router();
function assertOwnership(
  feedProviderAddress: string,
  claimedAddress: string,
  action: string,
): void {
  if (feedProviderAddress.toLowerCase() !== claimedAddress.toLowerCase()) {
    throw new ValidationError(
      `Unauthorized: only the feed provider (${feedProviderAddress.slice(0, 10)}...) can ${action} this feed`,
    );
  }
}

// ── POST /api/provider/register ──────────────────────────────────────────
router.post(
  "/register",
  asyncWrap(async (req, res) => {
    const body = req.body as Record<string, string>;

    assertRequired(body, [
      "name",
      "description",
      "category",
      "upstreamUrl",
      "method",
      "price",
      "providerAddress",
    ]);
    assertEthAddress(body.providerAddress, "providerAddress");
    assertHttpUrl(body.upstreamUrl, "upstreamUrl");
    assertCategory(body.category);
    assertMethod(body.method);
    assertPrice(body.price);

    const payload: RegisterFeedPayload = {
      name:            body.name.trim(),
      description:     body.description.trim(),
      category:        body.category as RegisterFeedPayload["category"],
      upstreamUrl:     body.upstreamUrl.trim(),
      method:          body.method as "GET" | "POST",
      price:           normalisePrice(body.price),
      providerAddress: body.providerAddress.trim(),
    };

    const feed = await registry.register(payload);
    res.status(201).json(feed);
  }),
);

// ── GET /api/provider/:address/feeds ─────────────────────────────────────
router.get(
  "/:address/feeds",
  asyncWrap(async (req, res) => {
    assertEthAddress(req.params.address, "address");
    const feeds = registry.getByProvider(req.params.address);
    // Provider sees full records including upstreamUrl (their own data)
    res.json(feeds);
  }),
);

// ── PUT /api/provider/feed/:id/pause  (toggle active ↔ paused) ──────────

router.put(
  "/feed/:id/pause",
  asyncWrap(async (req, res) => {
    const { id }    = req.params;
    const body      = req.body as Record<string, string>;

    // Require providerAddress in body
    assertRequired(body, ["providerAddress"]);
    assertEthAddress(body.providerAddress, "providerAddress");

    const feed = registry.getById(id);
    if (!feed) throw new NotFoundError("Feed");

    // Verify caller owns this feed
    assertOwnership(feed.providerAddress, body.providerAddress, "pause/unpause");

    const newStatus = feed.status === "active" ? "paused" : "active";
    const updated   = await registry.setStatus(id, newStatus);

    res.json({ id, status: updated?.status, providerAddress: feed.providerAddress });
  }),
);

// ── DELETE /api/provider/feed/:id ────────────────────────────────────────

router.delete(
  "/feed/:id",
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    const body   = req.body as Record<string, string>;

    // Require providerAddress in body
    assertRequired(body, ["providerAddress"]);
    assertEthAddress(body.providerAddress, "providerAddress");

    const feed = registry.getById(id);
    if (!feed) throw new NotFoundError("Feed");

    // Verify caller owns this feed
    assertOwnership(feed.providerAddress, body.providerAddress, "delete");

    await registry.delete(id);
    res.status(204).send();
  }),
);

export default router;