import type { Request, Response, NextFunction, RequestHandler } from "express";
import { registry } from "../db/registry.js";

const FEED_URL_RE = /^\/feed\/([^/]+)$/;

type PaymentMiddlewareFactory = (
  address: string,
  routes: Record<string, { price: string; network: string }>,
) => RequestHandler;

export function buildDynamicX402(
  paymentMiddleware: PaymentMiddlewareFactory,
  platformAddress: string,
  network: string,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const match = FEED_URL_RE.exec(req.path);
    if (!match) return next();
    if (req.method !== "GET" && req.method !== "POST") return next();

    const feedId = match[1];
    const feed = registry.getById(feedId);
    if (!feed || feed.status !== "active") return next();

    const routeKey = `${req.method} /feed/[feedId]`;
    const gate = paymentMiddleware(platformAddress, {
      [routeKey]: {
        price: feed.price,
        network,
      },
    });

    gate(req, res, next);
  };
}