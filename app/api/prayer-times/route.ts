import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Prayer Times API - $0.005 per request
 *
 * Returns Islamic prayer times for any city worldwide.
 * Source: Aladhan.com API (free, reliable, well-maintained).
 * Adds value with clean formatting and multiple calculation methods.
 */

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const country = searchParams.get("country");
  const date = searchParams.get("date"); // DD-MM-YYYY format, defaults to today
  const method = searchParams.get("method") || "4"; // 4 = Umm Al-Qura (default for Gulf)

  if (!city) {
    return NextResponse.json({ error: "Missing 'city' query parameter" }, { status: 400 });
  }

  try {
    const dateParam = date || new Date().toLocaleDateString("en-GB").replace(/\//g, "-");

    // First geocode the city to get coordinates (more reliable than city+country lookup)
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoResponse.json();

    let response;
    if (geoData.results?.length) {
      const lat = geoData.results[0].latitude;
      const lon = geoData.results[0].longitude;
      response = await fetch(
        `https://api.aladhan.com/v1/timings/${dateParam}?latitude=${lat}&longitude=${lon}&method=${method}`
      );
    } else if (country) {
      response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${dateParam}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`
      );
    } else {
      return NextResponse.json(
        { error: `City '${city}' not found. Try adding a 'country' parameter.` },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch prayer times" }, { status: 502 });
    }

    const data = await response.json();

    if (data.code !== 200 || !data.data) {
      return NextResponse.json({ error: "City not found or invalid parameters" }, { status: 404 });
    }

    const timings = data.data.timings;
    const meta = data.data.meta;
    const dateInfo = data.data.date;

    return NextResponse.json({
      city,
      country: country || meta.timezone?.split("/")[0] || "Unknown",
      date: dateInfo.readable,
      hijri: {
        date: dateInfo.hijri.date,
        month: dateInfo.hijri.month.en,
        year: dateInfo.hijri.year,
      },
      prayers: {
        fajr: timings.Fajr,
        sunrise: timings.Sunrise,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
      },
      extras: {
        midnight: timings.Midnight,
        firstthird: timings.Firstthird,
        lastthird: timings.Lastthird,
      },
      calculation_method: meta.method.name,
      timezone: meta.timezone,
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
    description: "Islamic prayer times - Fajr, Dhuhr, Asr, Maghrib, Isha for any city worldwide with Hijri date",
  },
  resourceServer
);
