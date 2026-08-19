import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions";
import { resourceServer, payTo, network } from "@/lib/x402-server";
import * as cheerio from "cheerio";

/**
 * Web Scraping API - $0.02 per request
 * Extracts text content, links, and metadata from any URL.
 * AI agents use this to gather web data without running a browser.
 */
const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "x402-scraper/1.0 (paid-api)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and nav elements
    $("script, style, nav, footer, header, aside").remove();

    const title = $("title").text().trim();
    const description = $('meta[name="description"]').attr("content") || "";
    const text = $("body").text().replace(/\s+/g, " ").trim();
    const links = $("a[href]")
      .map((_, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr("href"),
      }))
      .get()
      .filter((l) => l.text && l.href)
      .slice(0, 50);

    return NextResponse.json({
      url,
      title,
      description,
      text: text.slice(0, 5000),
      links,
      scraped_at: new Date().toISOString(),
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
      price: "$0.02",
      network,
      payTo,
    },
    description: "Web scraping - extracts text, links, and metadata from any URL",
  },
  resourceServer
);
