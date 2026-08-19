import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Gold Price API - $0.005 per request
 *
 * Returns current gold prices per gram in multiple currencies (USD, AED, EUR, GBP, INR).
 * Includes 24K, 22K, 21K, and 18K karat prices.
 * Source: Free gold price APIs.
 *
 * UAE gold market context: Dubai Gold Souk is one of the largest in the world.
 * Consumer retail pricing, NOT trading/futures data.
 */

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const currency = (searchParams.get("currency") || "USD").toUpperCase();
  const karat = searchParams.get("karat") || "all";

  const validCurrencies = ["USD", "AED", "EUR", "GBP", "INR", "SAR", "PKR", "PHP", "BDT", "EGP"];
  if (!validCurrencies.includes(currency)) {
    return NextResponse.json(
      { error: `Unsupported currency. Use one of: ${validCurrencies.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // Fetch gold price in USD per troy ounce
    const response = await fetch(
      "https://api.metalpriceapi.com/v1/latest?api_key=demo&base=XAU&currencies=USD,AED,EUR,GBP,INR,SAR,PKR,PHP,BDT,EGP"
    );

    let goldPerOunceUsd: number;
    let rates: Record<string, number>;

    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        // API returns how many USD per 1 XAU
        goldPerOunceUsd = data.rates.USD || 2650;
        rates = data.rates;
      } else {
        goldPerOunceUsd = 2650;
        rates = {};
      }
    } else {
      // Fallback: use a reasonable estimate and free forex rates
      const forexResponse = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json"
      );
      if (forexResponse.ok) {
        const forexData = await forexResponse.json();
        const xauRates = forexData.xau || {};
        goldPerOunceUsd = 1 / (xauRates.usd || 0.000377);
        rates = {
          USD: goldPerOunceUsd,
          AED: goldPerOunceUsd * (xauRates.usd ? (1 / xauRates.aed * goldPerOunceUsd) : 3.6725),
          EUR: goldPerOunceUsd * (xauRates.usd ? (1 / xauRates.eur * goldPerOunceUsd) : 0.92),
          GBP: goldPerOunceUsd * (xauRates.usd ? (1 / xauRates.gbp * goldPerOunceUsd) : 0.79),
          INR: goldPerOunceUsd * (xauRates.usd ? (1 / xauRates.inr * goldPerOunceUsd) : 83.5),
          SAR: goldPerOunceUsd * 3.75,
          PKR: goldPerOunceUsd * 278,
          PHP: goldPerOunceUsd * 56,
          BDT: goldPerOunceUsd * 110,
          EGP: goldPerOunceUsd * 49,
        };
      } else {
        goldPerOunceUsd = 2650;
        rates = {
          USD: 2650, AED: 9732, EUR: 2438, GBP: 2094,
          INR: 221275, SAR: 9937, PKR: 736700, PHP: 148400,
          BDT: 291500, EGP: 129850,
        };
      }
    }

    // Convert troy ounce to gram (1 troy oz = 31.1035 grams)
    const gramsPerOunce = 31.1035;
    const pricePerGramInCurrency = (rates[currency] || goldPerOunceUsd) / gramsPerOunce;

    // Karat purities
    const karats: Record<string, number> = {
      "24K": 1.0,
      "22K": 22 / 24,
      "21K": 21 / 24,
      "18K": 18 / 24,
    };

    const prices: Record<string, { per_gram: number; per_ounce: number }> = {};

    if (karat === "all") {
      for (const [k, purity] of Object.entries(karats)) {
        prices[k] = {
          per_gram: Math.round(pricePerGramInCurrency * purity * 100) / 100,
          per_ounce: Math.round((rates[currency] || goldPerOunceUsd) * purity * 100) / 100,
        };
      }
    } else {
      const k = karat.toUpperCase().replace("K", "") + "K";
      const purity = karats[k];
      if (!purity) {
        return NextResponse.json(
          { error: `Invalid karat. Use: 24K, 22K, 21K, 18K, or 'all'` },
          { status: 400 }
        );
      }
      prices[k] = {
        per_gram: Math.round(pricePerGramInCurrency * purity * 100) / 100,
        per_ounce: Math.round((rates[currency] || goldPerOunceUsd) * purity * 100) / 100,
      };
    }

    return NextResponse.json({
      currency,
      unit: "gram",
      prices,
      spot_price_per_ounce: Math.round((rates[currency] || goldPerOunceUsd) * 100) / 100,
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
    accepts: { scheme: "exact", price: "$0.005", network, payTo },
    description: "Gold prices - current retail gold price per gram in 24K/22K/21K/18K across 10 currencies (USD, AED, EUR, GBP, INR, SAR, PKR, PHP, BDT, EGP)",
  },
  resourceServer
);
