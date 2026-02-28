import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { registry } from "./db/registry.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { feedProxyHandler } from "./skills/feedProxy.js";
import { buildDynamicX402 } from "./middleware/dynamicX402.js";

import providerRoutes from "./routes/provider.js";
import catalogRoutes from "./routes/catalog.js";
import testcallRoutes from "./routes/testcall.js";
import statsRoutes from "./routes/stats.js";
import snippetRoutes from "./routes/snippet.js";

const REQUIRED_ENV = ["PLATFORM_ADDRESS"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required env var: ${key}`);
    process.exit(1);
  }
}

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
if (!ETH_ADDRESS_RE.test(process.env.PLATFORM_ADDRESS!)) {
  console.error(`[startup] PLATFORM_ADDRESS is not a valid Ethereum address: ${process.env.PLATFORM_ADDRESS}`);
  process.exit(1);
}

const PORT = parseInt(process.env.PORT ?? "4020", 10);
const NETWORK = process.env.NETWORK ?? "base-sepolia";
const PLATFORM_ADDRESS = process.env.PLATFORM_ADDRESS!;

const CORS_OPTIONS: cors.CorsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-PAYMENT",
    "X-Requested-With",
  ],
  exposedHeaders: [
    "X-PAYMENT-RESPONSE",
    "X-LiveFeed-Id",
    "X-LiveFeed-Latency-Ms",
    "X-LiveFeed-Price",
  ],
  credentials: false,
  maxAge: 86400,
};

async function bootstrap() {
  await registry.init();

  const app = express();
  app.set("trust proxy", true);
  app.use(cors(CORS_OPTIONS));
  app.options("*", cors(CORS_OPTIONS));

  app.use(express.json({ limit: "50kb" }));
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      network: NETWORK,
      platform: PLATFORM_ADDRESS,
      feedsLoaded: registry.getAll().length,
      uptime: Math.round(process.uptime()),
    });
  });

  app.use("/api/provider", providerRoutes);
  app.use("/api/catalog", catalogRoutes);
  app.use("/api/testcall", testcallRoutes);
  app.use("/api/stats", statsRoutes);
  app.use("/api/snippet", snippetRoutes);

  let x402Active = false;
  try {
    const { paymentMiddleware } = await import("x402-express");
    app.use(
      buildDynamicX402(paymentMiddleware as any, PLATFORM_ADDRESS, NETWORK),
    );
    x402Active = true;
    console.log("[x402] dynamic payment middleware active — per-feed pricing ✓");
  } catch (err) {
    console.warn("[x402] x402-express not found — /feed/* routes are UNPROTECTED (dev mode)");
  }

  app.all("/feed/:feedId", feedProxyHandler);

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  LiveFeed Backend`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  Port:     ${PORT}`);
    console.log(`  Network:  ${NETWORK}`);
    console.log(`  Platform: ${PLATFORM_ADDRESS}`);
    console.log(`  Feeds:    ${registry.getAll().length} loaded`);
    console.log(`  x402:     ${x402Active ? "DYNAMIC PRICING ACTIVE ✓" : "INACTIVE (dev mode)"}`);
    console.log(`  CORS:     X-PAYMENT ✓  X-PAYMENT-RESPONSE ✓`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  });
}

bootstrap().catch((err) => {
  console.error("[startup] Fatal error:", err);
  process.exit(1);
});