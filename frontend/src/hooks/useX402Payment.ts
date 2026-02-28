import { useState, useCallback } from "react";
import { useAccount, useSignTypedData, useReadContract, useChainId } from "wagmi";
import { formatUnits } from "viem";
import {
  USDC_ADDRESS,
  USDC_NAME,
  USDC_VERSION,
  CHAIN_ID,
  ERC20_ABI,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
} from "../lib/wagmi";
import type { Feed } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export type PaymentStatus =
  | "idle"
  | "fetching"
  | "signing"
  | "paying"
  | "success"
  | "error";

export interface PaymentResult {
  status: PaymentStatus;
  data: unknown | null;
  error: string | null;
  latencyMs: number | null;
  paidAmount: string | null;
  txHash: string | null;
}

interface X402Accept {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: { name: string; version: string };
}

interface X402Response {
  x402Version: number;
  accepts: X402Accept[];
}

function randomNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex}`;
}

function encodePaymentHeader(
  accept: X402Accept,
  from: string,
  nonce: string,
  validBefore: number,
  signature: string,
): string {
  const payload = {
    x402Version: 1,
    scheme: accept.scheme,
    network: accept.network,
    payload: {
      signature,
      authorization: {
        from,
        to: accept.payTo,
        value: accept.maxAmountRequired,
        validAfter: "0",
        validBefore: String(validBefore),
        nonce,
      },
    },
  };
  return btoa(JSON.stringify(payload));
}

export function useX402Payment() {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const chainId = useChainId();

  const [result, setResult] = useState<PaymentResult>({
    status: "idle",
    data: null,
    error: null,
    latencyMs: null,
    paidAmount: null,
    txHash: null,
  });

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const usdcHuman = usdcBalance !== undefined
    ? parseFloat(formatUnits(usdcBalance, 6))
    : null;

  const pay = useCallback(async (feed: Feed) => {
    if (!isConnected || !address) {
      setResult({ status: "error", data: null, error: "Connect your wallet first", latencyMs: null, paidAmount: null, txHash: null });
      return;
    }

    if (chainId !== CHAIN_ID) {
      setResult({
        status: "error", data: null, latencyMs: null, paidAmount: null, txHash: null,
        error: "Wrong network — switch to Base Sepolia",
      });
      return;
    }

    const feedUrl = `${API_BASE_URL}/feed/${feed.id}`;
    const start = Date.now();

    try {
      setResult({ status: "fetching", data: null, error: null, latencyMs: null, paidAmount: null, txHash: null });

      const r1 = await fetch(feedUrl, { method: feed.method });

      if (r1.status !== 402) {
        const data = await r1.json();
        setResult({ status: "success", data, error: null, latencyMs: Date.now() - start, paidAmount: null, txHash: null });
        return;
      }

      const paymentReq: X402Response = await r1.json();
      const accept = paymentReq.accepts?.[0];
      if (!accept) throw new Error("Invalid 402 response");

      const atomicAmount = parseInt(accept.maxAmountRequired, 10);
      if (isNaN(atomicAmount) || atomicAmount > 1_000_000) {
        throw new Error(`Amount too high: ${atomicAmount}`);
      }

      if (usdcBalance !== undefined && usdcBalance < BigInt(atomicAmount)) {
        throw new Error(`Insufficient USDC — need $${(atomicAmount / 1e6).toFixed(2)}`);
      }

      setResult({ status: "signing", data: null, error: null, latencyMs: null, paidAmount: null, txHash: null });

      const nonce = randomNonce();
      const validBefore = Math.floor(Date.now() / 1000) + accept.maxTimeoutSeconds;

      const domain = {
        name: accept.extra?.name ?? USDC_NAME,
        version: accept.extra?.version ?? USDC_VERSION,
        chainId: CHAIN_ID,
        verifyingContract: accept.asset as `0x${string}`,
      };

      const signature = await signTypedDataAsync({
        domain,
        types: TRANSFER_WITH_AUTHORIZATION_TYPES,
        primaryType: "TransferWithAuthorization",
        message: {
          from: address,
          to: accept.payTo as `0x${string}`,
          value: BigInt(atomicAmount),
          validAfter: BigInt(0),
          validBefore: BigInt(validBefore),
          nonce: nonce as `0x${string}`,
        },
      });

      const xPayment = encodePaymentHeader(accept, address, nonce, validBefore, signature);

      setResult({ status: "paying", data: null, error: null, latencyMs: null, paidAmount: null, txHash: null });

      const r2 = await fetch(feedUrl, {
        method: feed.method,
        headers: { "X-PAYMENT": xPayment, "Accept": "application/json" },
      });

      const latencyMs = Date.now() - start;

      if (!r2.ok) {
        const errBody = await r2.json().catch(() => ({}));
        console.error("[x402] payment rejected", { status: r2.status, body: errBody });
        const reason = errBody?.error ?? errBody?.message ?? errBody?.reason ?? `Payment rejected (${r2.status})`;
        throw new Error(reason);
      }

      const data = await r2.json();
      const paidAmount = `$${(atomicAmount / 1e6).toFixed(2)}`;

      let txHash: string | null = null;
      const xPaymentResponse = r2.headers.get("X-PAYMENT-RESPONSE");
      if (xPaymentResponse) {
        try {
          const decoded = JSON.parse(atob(xPaymentResponse));
          txHash = decoded?.txHash ?? decoded?.transaction?.hash ?? decoded?.result?.transactionHash ?? null;
        } catch {
          console.warn("[x402] Could not parse X-PAYMENT-RESPONSE header");
        }
      }

      setResult({ status: "success", data, error: null, latencyMs, paidAmount, txHash });

    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Payment failed";
      const friendly = msg.includes("rejected") ? "Signature cancelled" : msg;
      setResult({ status: "error", data: null, error: friendly, latencyMs: null, paidAmount: null, txHash: null });
    }
  }, [isConnected, address, usdcBalance, signTypedDataAsync]);

  const reset = useCallback(() => {
    setResult({ status: "idle", data: null, error: null, latencyMs: null, paidAmount: null, txHash: null });
  }, []);

  return {
    pay,
    reset,
    result,
    isConnected,
    address,
    usdcHuman,
  };
}