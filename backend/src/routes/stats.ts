import { Router } from "express";
import { registry } from "../db/registry.js";
import { asyncWrap } from "../middleware/errorHandler.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";

const router = Router();

// Helper to fetch balance from RPC (Free)
async function getSepoliaBalances(address: string) {
  const rpcUrl = "https://base-sepolia-rpc.publicnode.com";
  const usdcContract = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC

  try {
    // 1. Get ETH Balance
    const ethRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
      }),
    });
    const ethData = await ethRes.json();
    const ethWei = BigInt(ethData.result);
    const ethBalance = (Number(ethWei) / 1e18).toFixed(6);

    // 2. Get USDC Balance (via eth_call)
    const usdcRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: usdcContract,
            data: `0x70a08231000000000000000000000000${address.replace("0x", "")}`,
          },
          "latest",
        ],
        id: 2,
      }),
    });
    const usdcData = await usdcRes.json();
    const usdcAtomic = BigInt(usdcData.result || "0x0");
    const usdcBalance = (Number(usdcAtomic) / 1e6).toFixed(2);

    return { ETH: ethBalance, USDC: usdcBalance };
  } catch (err) {
    console.error("[stats] RPC balance fetch failed:", err);
    return { ETH: "0.000000", USDC: "0.00" };
  }
}

// ── GET /api/stats/feed/:feedId ──
router.get(
  "/feed/:feedId",
  asyncWrap(async (req, res) => {
    const feed = registry.getById(req.params.feedId);
    if (!feed) throw new NotFoundError("Feed");

    res.json({
      id: feed.id,
      name: feed.name,
      category: feed.category,
      price: feed.price,
      callCount: feed.callCount,
      earnedUsdc: (feed.totalEarnedAtomic / 1e6).toFixed(2),
      avgLatencyMs: feed.avgLatencyMs,
      lastCalledAt: feed.lastCalledAt,
      status: feed.status,
      createdAt: feed.createdAt,
    });
  }),
);

// ── GET /api/stats/:address ──
router.get(
  "/:address",
  asyncWrap(async (req, res) => {
    const { address } = req.params;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new ValidationError("Invalid Ethereum address");
    }

    // Fetch balances via RPC for free instead of paying Pinion
    const walletBalance = await getSepoliaBalances(address);

    const feeds = registry.getByProvider(address);
    const totalCalls = feeds.reduce((sum, f) => sum + f.callCount, 0);
    const totalEarnedAtomic = feeds.reduce((sum, f) => sum + f.totalEarnedAtomic, 0);

    res.json({
      providerAddress: address,
      walletBalance,
      totalCalls,
      totalEarnedUsdc: (totalEarnedAtomic / 1e6).toFixed(2),
      feeds: feeds.map((f) => ({
        id: f.id,
        name: f.name,
        callCount: f.callCount,
        earnedUsdc: (f.totalEarnedAtomic / 1e6).toFixed(2),
        avgLatencyMs: f.avgLatencyMs,
        lastCalledAt: f.lastCalledAt,
        status: f.status,
      })),
    });
  }),
);

export default router;
