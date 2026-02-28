// wagmi.ts
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";
import { http } from "wagmi";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "demo";

const RPC_URL = import.meta.env.DEV
  ? "/rpc"
  : "https://base-sepolia-rpc.publicnode.com";

export const wagmiConfig = getDefaultConfig({
  appName: "LiveFeed",
  appUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
  projectId,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(RPC_URL),
  },
  ssr: false,
});

export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export const USDC_NAME = "USD Coin";
export const USDC_VERSION = "2";
export const CHAIN_ID = 84532;

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;