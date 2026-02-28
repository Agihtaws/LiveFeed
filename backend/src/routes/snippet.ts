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

    // Build the backend base URL dynamically (trust proxy if behind reverse proxy)
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const tsCode = [
      `import { PinionClient, payX402Service } from "pinion-os";`,
      `import { parseUnits } from "viem";`,
      ``,
      `// Initialize the client with your wallet private key`,
      `const client = new PinionClient({`,
      `  privateKey: process.env.PINION_PRIVATE_KEY,`,
      `  network: "base-sepolia",`,
      `});`,
      ``,
      `// Feed: ${feed.name} (${feed.price} USDC per call)`,
      `const feedUrl = "${baseUrl}/feed/${feed.id}";`,
      ``,
      `// The x402 flow is handled by payX402Service`,
      `const result = await payX402Service(client.signer, feedUrl, {`,
      `  method: "${feed.method}",`,
      `  maxAmount: "1000000", // safety cap: max $1.00`,
      `  ${feed.method === 'POST' ? 'body: JSON.stringify({ your: "data" }),' : ''}`,
      `});`,
      ``,
      `if (result.status === 200) {`,
      `  console.log("Data:", result.data);`,
      `  console.log("Paid:", result.paidAmount, "atomic USDC");`,
      `} else {`,
      `  console.error("Payment failed:", result.data);`,
      `}`,
    ].filter(Boolean).join("\n");

    const curlNote = [
      `# 1. First request returns 402 with payment requirements:`,
      `curl -v ${baseUrl}/feed/${feed.id}`,
      ``,
      `# 2. Sign EIP-3009 USDC authorization with your wallet (e.g., using the frontend or pinion_pay_service)`,
      `# 3. Retry with X-PAYMENT header — the SDK or frontend does this automatically.`,
      `# See the TypeScript snippet for programmatic usage.`,
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