import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Currency Conversion API - $0.003 per request
 *
 * Converts between 150+ currencies with real-time exchange rates.
 * Includes major fiat (USD, EUR, GBP, AED, SAR) and crypto (BTC, ETH).
 * Source: Free currency API (fawazahmed0/currency-api).
 *
 * Cheapest endpoint — designed for high-frequency agent calls.
 * Remittance corridors (INR, PKR, PHP, BDT, EGP) included for GCC relevance.
 */

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get("from") || "USD").toLowerCase();
  const to = (searchParams.get("to") || "AED").toLowerCase();
  const amountStr = searchParams.get("amount") || "1";

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Currency '${from.toUpperCase()}' not found` },
        { status: 404 }
      );
    }

    const data = await response.json();
    const rates = data[from];

    if (!rates || !rates[to]) {
      return NextResponse.json(
        { error: `Cannot convert ${from.toUpperCase()} to ${to.toUpperCase()}` },
        { status: 404 }
      );
    }

    const rate = rates[to];
    const converted = Math.round(amount * rate * 10000) / 10000;
    const inverseRate = Math.round((1 / rate) * 10000) / 10000;

    return NextResponse.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      converted,
      rate: Math.round(rate * 10000) / 10000,
      inverse_rate: inverseRate,
      date: data.date,
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
    accepts: { scheme: "exact", price: "$0.003", network, payTo },
    description: "Currency conversion - 150+ currencies with real-time rates. Supports fiat (USD, EUR, AED, SAR, INR, PKR) and crypto (BTC, ETH)",
  },
  resourceServer
);
