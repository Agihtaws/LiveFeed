import { Link } from "react-router-dom";
import CopyButton from "../components/shared/CopyButton";

const SDK_SNIPPET = `import { PinionClient } from "pinion-os";

const client = new PinionClient({
  privateKey: process.env.PRIVATE_KEY,
});

// Automatically handles: 402 → sign EIP-3009 → retry
const data = await client.request("GET", "/feed/<feedId>");
console.log(data);`;

const SERVER_SNIPPET = `import { createSkillServer, skill } from "pinion-os/server";

const server = createSkillServer({
  payTo:   "0xYOUR_WALLET",
  network: "base-sepolia",
});

server.add(skill("my-data", {
  price: "$0.01",
  handler: async (req, res) => {
    const data = await fetchMyData();
    res.json(data);
  },
}));

server.listen(4020);`;

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12 animate-fade-up">
        <div className="inline-flex items-center gap-2 border border-violet/20 bg-violet/5 text-violet text-xs font-mono px-3 py-1.5 rounded-full mb-5">
          Technical Deep Dive
        </div>
        <h1 className="font-display text-5xl font-bold text-text-1 mb-4">How LiveFeed Works</h1>
        <p className="text-text-2 text-lg leading-relaxed">
          LiveFeed uses the x402 protocol — an HTTP-native micropayment standard built on
          USDC and EIP-3009 on Base Sepolia.
        </p>
      </div>

      {/* x402 Flow */}
      <section className="mb-12 animate-fade-up stagger-1">
        <h2 className="font-display text-2xl font-bold text-text-1 mb-6">The x402 Payment Flow</h2>
        <div className="card p-6 space-y-4">
          {[
            {
              step: "01", color: "text-cyan",    bg: "bg-cyan/10    border-cyan/20",
              title: "Initial Request → 402",
              body:  "Consumer makes a normal GET request. Server responds 402 Payment Required with JSON specifying the amount, network, USDC asset address, and payTo wallet.",
              code:  `GET /feed/<id>\n→ HTTP 402\n← { "x402Version": 1, "accepts": [{ "scheme": "exact", "asset": "0x036CbD5...", "maxAmountRequired": "10000" }] }`,
            },
            {
              step: "02", color: "text-violet",  bg: "bg-violet/10  border-violet/20",
              title: "Sign EIP-3009 Authorization",
              body:  "Consumer wallet signs a gasless EIP-3009 TransferWithAuthorization. This authorizes the exact USDC amount transfer — no ETH needed for gas.",
              code:  `// EIP-712 structured data sign\n// authorizes: from=consumer, to=platform, value=10000`,
            },
            {
              step: "03", color: "text-amber",   bg: "bg-amber/10   border-amber/20",
              title: "Retry with X-PAYMENT Header",
              body:  "Consumer retries the request with the signed authorization in the X-PAYMENT header. The x402-express middleware verifies it via the payai.network facilitator.",
              code:  `GET /feed/<id>\nX-PAYMENT: <base64 signed auth>\n→ Facilitator submits USDC transfer on-chain`,
            },
            {
              step: "04", color: "text-emerald", bg: "bg-emerald/10  border-emerald/20",
              title: "Data flows, USDC moves",
              body:  "Payment verified → server proxies to upstream API → returns real data. Stats recorded. Platform wallet receives USDC atomically.",
              code:  `HTTP 200\n← { "bitcoin": { "usd": 65000 } }\nX-LiveFeed-Price: $0.01\nX-LiveFeed-Latency-Ms: 200`,
            },
          ].map(({ step, color, bg, title, body, code }) => (
            <div key={step} className={`border rounded-xl p-5 ${bg}`}>
              <div className="flex items-start gap-4">
                <span className={`font-mono text-xs font-bold ${color} shrink-0 mt-0.5`}>{step}</span>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-display font-semibold ${color} mb-1.5`}>{title}</h3>
                  <p className="text-text-2 text-sm leading-relaxed mb-3">{body}</p>
                  <pre className="bg-bg/60 rounded-lg p-3 text-xs font-mono text-text-2 overflow-auto">{code}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For consumers */}
      <section className="mb-12 animate-fade-up stagger-2">
        <h2 className="font-display text-2xl font-bold text-text-1 mb-6">For API Consumers</h2>
        <div className="card p-6">
          <p className="text-text-2 text-sm mb-5 leading-relaxed">
            Use the Pinion SDK — it handles the entire 402 → sign → retry cycle automatically.
            You only need a funded Base Sepolia wallet with USDC.
          </p>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red/50" />
                <span className="w-3 h-3 rounded-full bg-amber/50" />
                <span className="w-3 h-3 rounded-full bg-emerald/50" />
              </div>
              <CopyButton text={SDK_SNIPPET} />
            </div>
            <pre className="bg-bg border border-border rounded-xl p-4 text-xs text-cyan/90 font-mono overflow-auto leading-relaxed">
              {SDK_SNIPPET}
            </pre>
          </div>
          <div className="mt-4 p-3 bg-surface-2 border border-border rounded-lg text-xs font-mono text-text-3">
            npm install pinion-os
          </div>
        </div>
      </section>

      {/* For providers */}
      <section className="mb-12 animate-fade-up stagger-3">
        <h2 className="font-display text-2xl font-bold text-text-1 mb-6">For API Providers</h2>
        <div className="card p-6">
          <p className="text-text-2 text-sm mb-5 leading-relaxed">
            Use LiveFeed's registration UI above — or build your own x402 skill server with
            the Pinion SDK to sell any data endpoint directly.
          </p>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red/50" />
                <span className="w-3 h-3 rounded-full bg-amber/50" />
                <span className="w-3 h-3 rounded-full bg-emerald/50" />
              </div>
              <CopyButton text={SERVER_SNIPPET} />
            </div>
            <pre className="bg-bg border border-border rounded-xl p-4 text-xs text-violet/90 font-mono overflow-auto leading-relaxed">
              {SERVER_SNIPPET}
            </pre>
          </div>
        </div>
      </section>

      {/* Key concepts */}
      <section className="mb-12 animate-fade-up stagger-4">
        <h2 className="font-display text-2xl font-bold text-text-1 mb-6">Key Concepts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "EIP-3009",         body: "Gasless USDC transfers via TransferWithAuthorization. Consumers sign off-chain, facilitator submits on-chain." },
            { title: "x402 Protocol",    body: "HTTP 402 as a machine-readable payment wall. Any HTTP client can implement it — no wallet SDK required." },
            { title: "Base Sepolia",      body: "USDC contract: 0x036CbD53... — testnet funds from Circle's faucet. Free to experiment." },
            { title: "Atomic Units",     body: "1 USDC = 1,000,000 atomic units. $0.01 = 10,000 atomic. Used in the accepts[] array of every 402 response." },
          ].map(({ title, body }) => (
            <div key={title} className="card p-5">
              <h3 className="font-mono font-semibold text-cyan text-sm mb-2">{title}</h3>
              <p className="text-text-2 text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="card p-8 text-center border-cyan/10 animate-fade-up stagger-5">
        <h2 className="font-display text-2xl font-bold text-text-1 mb-3">Ready to start?</h2>
        <p className="text-text-2 mb-6">Browse live feeds or register your own API in minutes.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/catalog" className="px-6 py-3 bg-cyan text-bg font-semibold rounded-xl hover:bg-cyan-hover transition-colors text-sm">
            Browse Catalog →
          </Link>
          <Link to="/provider" className="px-6 py-3 border border-border-2 text-text-2 rounded-xl hover:text-text-1 hover:border-cyan/30 transition-colors text-sm">
            Sell Your API
          </Link>
        </div>
      </div>
    </div>
  );
}