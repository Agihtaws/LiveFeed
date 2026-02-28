import { Router } from "express";
import { registry } from "../db/registry.js";
import { asyncWrap } from "../middleware/errorHandler.js";
import { NotFoundError } from "../shared/errors.js";

const router = Router();

router.get(
  "/:feedId",
  asyncWrap(async (req, res) => {
    const feed = registry.getById(req.params.feedId);
    if (!feed) throw new NotFoundError("Feed");

    const tsCode = [
      `import { PinionClient } from "pinion-os";`,
      ``,
      `const pinion = new PinionClient({`,
      `  privateKey: process.env.PINION_PRIVATE_KEY, // Base Sepolia wallet`,
      `});`,
      ``,
      `// ${feed.name} — ${feed.price} USDC per call (x402 auto-handled)`,
      `const result = await pinion.request("${feed.method}", "/feed/${feed.id}");`,
      `console.log(result.data);`,
      `// result.paidAmount will show how much was paid, e.g. "${feed.price}"`,
    ].join("\n");

    const curlNote = [
      `# 1. First request returns 402 with payment requirements:`,
      `curl -v http://your-server/feed/${feed.id}`,
      ``,
      `# 2. Sign EIP-3009 USDC authorization with your wallet`,
      `# 3. Retry with X-PAYMENT header — SDK does this automatically`,
      `# Use pinion_pay_service in Claude MCP, or PinionClient SDK`,
    ].join("\n");

    res.json({
      feedId: feed.id,
      name: feed.name,
      price: feed.price,
      method: feed.method,
      typescript: tsCode,
      curlNote,
    });
  }),
);

export default router;