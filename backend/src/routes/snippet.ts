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

    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    const tsCode = [
      `import { PinionClient, payX402Service } from "pinion-os";`,
      ``,
      `// Initialize the client with your wallet private key`,
      `const pinion = new PinionClient({`,
      `  privateKey: process.env.PINION_PRIVATE_KEY,`,
      `  network: "base-sepolia",`,
      `});`,
      ``,
      `// Feed: ${feed.name} (${feed.price} USDC per call)`,
      `const feedUrl = "${baseUrl}/feed/${feed.id}";`,
      ``,
      `// payX402Service handles the full 402 → sign → retry flow automatically`,
      `const result = await payX402Service(pinion.signer, feedUrl, {`,
      `  method: "${feed.method}",`,
      `  maxAmount: "1000000", // safety cap: max $1.00 USDC`,
      ...(feed.method === "POST" ? [`  body: JSON.stringify({ your: "data" }),`] : []),
      `});`,
      ``,
      `if (result.status === 200) {`,
      `  console.log("Data:", result.data);`,
      `  console.log("Paid:", result.paidAmount, "atomic USDC");`,
      `} else {`,
      `  console.error("Payment failed:", result.data);`,
      `}`,
    ].join("\n");

    const curlNote = [
      `# 1. First request returns 402 with payment requirements:`,
      `curl -v ${baseUrl}/feed/${feed.id}`,
      ``,
      `# 2. Sign EIP-3009 USDC authorization with your wallet.`,
      `#    The pinion-os SDK does this automatically (see TypeScript snippet above).`,
      ``,
      `# 3. Retry with X-PAYMENT header:`,
      `# curl -H "X-PAYMENT: <base64-payload>" ${baseUrl}/feed/${feed.id}`,
    ].join("\n");

    res.json({
      feedId:     feed.id,
      name:       feed.name,
      price:      feed.price,
      method:     feed.method,
      typescript: tsCode,
      curlNote,
    });
  }),
);

export default router;
