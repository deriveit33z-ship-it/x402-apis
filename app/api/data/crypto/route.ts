import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Crypto Market Data API - $0.005 per request
 * Returns real-time price, volume, and market cap data for any cryptocurrency.
 * Uses CoinGecko free API under the hood.
 */
const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const coin = searchParams.get("coin") || "bitcoin";
  const currency = searchParams.get("currency") || "usd";

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${currency}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch market data" },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data[coin]) {
      return NextResponse.json(
        { error: `Coin '${coin}' not found. Use CoinGecko IDs (e.g., bitcoin, ethereum, solana)` },
        { status: 404 }
      );
    }

    const coinData = data[coin];

    return NextResponse.json({
      coin,
      currency,
      price: coinData[currency],
      market_cap: coinData[`${currency}_market_cap`],
      volume_24h: coinData[`${currency}_24h_vol`],
      change_24h_percent: coinData[`${currency}_24h_change`],
      last_updated: new Date(coinData.last_updated_at * 1000).toISOString(),
      fetched_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.005",
      network,
      payTo,
    },
    description: "Crypto market data - real-time price, volume, and market cap for any cryptocurrency",
  },
  resourceServer
);
