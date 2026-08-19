import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Weather Data API - $0.005 per request
 * Returns current weather conditions for any location.
 * Uses Open-Meteo (free, no API key needed).
 */
const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");

  let latitude: string;
  let longitude: string;
  let locationName: string;

  if (lat && lon) {
    latitude = lat;
    longitude = lon;
    locationName = `${lat}, ${lon}`;
  } else if (city) {
    // Geocode the city using Open-Meteo's geocoding API
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results?.length) {
      return NextResponse.json(
        { error: `City '${city}' not found` },
        { status: 404 }
      );
    }

    latitude = geoData.results[0].latitude.toString();
    longitude = geoData.results[0].longitude.toString();
    locationName = `${geoData.results[0].name}, ${geoData.results[0].country}`;
  } else {
    return NextResponse.json(
      { error: "Provide either 'city' or 'lat' & 'lon' query parameters" },
      { status: 400 }
    );
  }

  try {
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto`
    );

    if (!weatherResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch weather data" },
        { status: 502 }
      );
    }

    const weather = await weatherResponse.json();
    const current = weather.current;

    const weatherCodes: Record<number, string> = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Foggy", 48: "Depositing rime fog",
      51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
      61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
      71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
      80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
      95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
    };

    return NextResponse.json({
      location: locationName,
      coordinates: { lat: parseFloat(latitude), lon: parseFloat(longitude) },
      timezone: weather.timezone,
      current: {
        temperature_c: current.temperature_2m,
        feels_like_c: current.apparent_temperature,
        humidity_percent: current.relative_humidity_2m,
        precipitation_mm: current.precipitation,
        wind_speed_kmh: current.wind_speed_10m,
        wind_direction_deg: current.wind_direction_10m,
        condition: weatherCodes[current.weather_code] || "Unknown",
        weather_code: current.weather_code,
      },
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
    description: "Weather data - current conditions for any location worldwide",
  },
  resourceServer
);
