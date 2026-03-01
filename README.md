# LiveFeed

> A decentralized API marketplace where anyone can sell access to any API using per-call micropayments.  
> Built with x402, USDC on Base Sepolia, and a modern React frontend.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)][frontend-url]
[![Backend API](https://img.shields.io/badge/api-live-blue)][backend-url]
[![GitHub Repo](https://img.shields.io/badge/github-repo-black)][github-url]
[![YouTube Demo](https://img.shields.io/badge/video-demo-red)][yt-demo]
[![X Announcement](https://img.shields.io/badge/announcement-X-blue)][x-url]

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Testing the Payment Flow](#testing-the-payment-flow)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Links](#links)

---

## Overview

LiveFeed is a platform that transforms any REST API into a paid endpoint in minutes.  
Providers register their APIs (feeds) with a price (e.g. `$0.01` per call). Consumers browse the catalog, connect their wallet, and pay per call using **USDC on Base Sepolia** via the **x402** protocol.

The x402 flow is fully integrated:
- Unauthenticated requests to `/feed/:id` return a `402 Payment Required` with USDC payment requirements.
- The client signs a **gasless EIP-3009** authorization, retries with an `X-PAYMENT` header, and receives the upstream data after the facilitator verifies the on‑chain transfer.

The result is a seamless, trustless micropayment system—no subscriptions, no billing infrastructure.

---

## Features

- **Provider Dashboard** – Register, pause/resume, and delete your feeds. Real‑time stats: calls, earnings, latency.
- **Consumer Catalog** – Browse feeds by category, search, and sort. Live updates of call counts and earnings (polled every 15s).
- **Per‑Call Payments** – `x402` with EIP‑3009 USDC transfers (no ETH gas needed for the user).
- **POST Feed Support** – Send JSON bodies with your paid calls; the backend forwards them unchanged.
- **Free Previews** – 3 free test calls per hour per feed (rate‑limited server‑side).
- **On‑Chain Proof** – After a successful payment, the `X-PAYMENT-RESPONSE` header returns the transaction hash; the frontend shows a Basescan link.
- **Wallet Integration** – RainbowKit + Wagmi, auto‑network switching, USDC balance display.
- **Snippet Generator** – Get ready‑to‑use TypeScript code to call a feed via the Pinion SDK.
- **Responsive UI** – Mobile hamburger menu, animated cards, tailwind‑styled.

---

## Tech Stack

**Backend**
- Node.js + Express + TypeScript
- x402‑express for payment middleware
- In‑memory registry + atomic JSON persistence
- Fetch for proxying upstream APIs
- Rate limiting (3 per hour per feed) via in‑memory store

**Frontend**
- React + TypeScript + Vite
- TanStack Query for data fetching / polling
- Wagmi + RainbowKit for wallet connection
- Tailwind CSS for styling
- React Router DOM for navigation

**Blockchain**
- Base Sepolia testnet
- USDC contract (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
- EIP‑3009 `TransferWithAuthorization` for gasless USDC transfers
- x402 facilitator (provided by Pinion)

---

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │ ──► │   Backend   │ ──► │   Upstream  │
│  (React)    │ ◄── │  (Express)  │ ◄── │    API      │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │
       │ 402 + x402 flow    │
       ▼                    ▼
┌─────────────────────────────────────────┐
│           x402 Facilitator              │
│  (verifies EIP‑3009 & submits tx)       │
└─────────────────────────────────────────┘
```

1. Consumer requests `/feed/:id`.
2. Backend responds `402` with payment requirements (USDC amount, payee address, etc.).
3. Frontend signs an EIP‑3009 authorization via the user’s wallet.
4. Frontend retries with `X-PAYMENT` header.
5. Backend verifies the payment with the facilitator (off‑chain call), then proxies to the upstream API.
6. Upstream data is returned; stats are updated in the registry.

---

## Prerequisites

- Node.js 18+ and npm
- Git
- A wallet with **Base Sepolia ETH** (for gas if needed, but EIP‑3009 is gasless for the user; the facilitator pays gas) and **Base Sepolia USDC** (for payments).  
  Get testnet USDC from [Circle Faucet](https://faucet.circle.com) and ETH from [QuickNode Faucet](https://faucet.quicknode.com/base/sepolia).
- (Optional) WalletConnect Project ID for production – get one at [WalletConnect Cloud](https://cloud.walletconnect.com).

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Agihtaws/LiveFeed.git
   cd LiveFeed
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend setup**
   ```bash
   cd ../frontend
   npm install
   ```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=4020
NETWORK=base-sepolia
PLATFORM_ADDRESS=0xYourPlatformWallet   # Wallet that receives payments (provider payouts handled off‑chain in this demo)
PINION_PRIVATE_KEY=your_private_key      # Private key of the platform wallet (used by facilitator for gas)
```
> **Note:** `PINION_PRIVATE_KEY` is required for the facilitator to submit the USDC transaction. It should match the wallet that will receive the payments (the `PLATFORM_ADDRESS`).

### Frontend (`frontend/.env`)
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id   # Optional, "demo" works for development
VITE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e   # Base Sepolia USDC
VITE_API_URL=http://localhost:4020               # Backend URL for local development
```
> For production, set `VITE_API_URL` to your deployed backend URL (e.g., `https://livefeed-backend.onrender.com`).

---

## Running Locally

1. **Start the backend** (from `/backend`)
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:4020`.

2. **Start the frontend** (from `/frontend`)
   ```bash
   npm run dev
   ```
   App will open on `http://localhost:5173`.

3. **Visit the app** – Connect your wallet and browse the catalog.  
   To test payments, ensure your wallet has enough Base Sepolia USDC.

---

## Testing the Payment Flow

We provide an end‑to‑end test script that simulates a consumer making two paid calls.

```bash
cd backend
npx tsx test-payment.ts
```

This script:
- Checks wallet balances.
- Picks a feed from the catalog.
- Makes two paid calls via `payX402Service`.
- Verifies that call count, earnings, and average latency update correctly.

**Expected output:** a receipt and a series of ✓ checks confirming the money route works.

---

## API Documentation

| Endpoint                      | Method | Description                                 |
|-------------------------------|--------|---------------------------------------------|
| `/api/catalog`                | GET    | List all feeds (public, no upstream URL)    |
| `/api/catalog?category=X`     | GET    | Filter by category                           |
| `/api/categories/counts`      | GET    | Get feed counts per category                 |
| `/api/provider/register`      | POST   | Register a new feed (requires wallet address)|
| `/api/provider/my-feeds/:addr`| GET    | List feeds owned by a provider               |
| `/api/provider/pause/:id`     | POST   | Pause/resume a feed (owner only)             |
| `/api/provider/delete/:id`    | DELETE | Delete a feed (owner only)                    |
| `/api/testcall/:feedId`       | POST   | Free test call (rate‑limited)                |
| `/api/stats/:address`         | GET    | Provider stats + wallet balances             |
| `/api/stats/feed/:feedId`     | GET    | Individual feed stats                        |
| `/api/snippet/:feedId`        | GET    | Generate TypeScript snippet for a feed       |
| `/feed/:feedId`               | GET/POST | Paid endpoint (x402‑protected)               |
| `/health`                     | GET    | Health check                                 |

---

## Deployment

### Backend (Render)
1. Push your code to GitHub.
2. Create a new **Web Service** on Render.
3. Point to your repository, set the **Root Directory** to `backend`.
4. Use the following settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables: `PLATFORM_ADDRESS`, `NETWORK` (and optionally `PINION_PRIVATE_KEY`).
6. Deploy – you'll get a URL like `https://livefeed-backend.onrender.com`.

### Frontend (Vercel)
1. Push your code to GitHub.
2. Import the project into Vercel, set the **Root Directory** to `frontend`.
3. Add environment variable `VITE_API_URL` pointing to your deployed backend (e.g., `https://livefeed-backend.onrender.com`).
4. Deploy – you'll get a URL like `https://live-feed-rouge.vercel.app`.

---

## License

MIT © [Agihtaws](https://github.com/Agihtaws)

---

## Links

- **Live Frontend**: [https://live-feed-rouge.vercel.app](https://live-feed-rouge.vercel.app)
- **Live Backend**: [https://livefeed-backend.onrender.com](https://livefeed-backend.onrender.com)
- **GitHub Repository**: [https://github.com/Agihtaws/LiveFeed](https://github.com/Agihtaws/LiveFeed)
- **YouTube Demo**: [https://youtu.be/ZFFIIXPqnos](https://youtu.be/ZFFIIXPqnos)
- **Announcement on X**: [https://x.com/Swathiga581/status/2027957088841023845](https://x.com/Swathiga581/status/2027957088841023845)

[frontend-url]: https://live-feed-rouge.vercel.app
[backend-url]: https://livefeed-backend.onrender.com
[github-url]: https://github.com/Agihtaws/LiveFeed
[yt-demo]: https://youtu.be/ZFFIIXPqnos
[x-url]: https://x.com/Swathiga581/status/2027957088841023845

