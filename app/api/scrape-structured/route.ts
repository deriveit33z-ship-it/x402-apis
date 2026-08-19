import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions";
import { resourceServer, payTo, network } from "@/lib/x402-server";
import * as cheerio from "cheerio";

/**
 * Smart Structured Web Scraper - $0.03 per request
 *
 * Unlike the basic scraper that returns raw text, this extracts and LABELS
 * structured data: prices, dates, emails, phone numbers, addresses, links,
 * headings, and metadata. Returns agent-ready JSON — no further parsing needed.
 *
 * This is the #1 most-used tool category for AI agents.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g;
const PRICE_REGEX = /(?:[$€£¥₹]|USD|EUR|GBP|AED|SAR)\s?\d[\d,.]*(?:\.\d{2})?|\d[\d,.]*\s?(?:USD|EUR|GBP|AED|SAR)/gi;
const DATE_REGEX = /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.]+\d{1,2},?\s*\d{4}/gi;

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "x402-structured-scraper/1.0" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 502 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise
    $("script, style, nav, footer, noscript, svg, iframe").remove();

    // Extract metadata
    const title = $("title").text().trim();
    const description = $('meta[name="description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || null;
    const canonical = $('link[rel="canonical"]').attr("href") || null;
    const language = $("html").attr("lang") || null;

    // Extract structured headings
    const headings: { level: number; text: string }[] = [];
    $("h1, h2, h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        headings.push({
          level: parseInt(el.tagName.replace("h", "")),
          text: text.slice(0, 200),
        });
      }
    });

    // Extract all text
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    // Extract structured data
    const emails = [...new Set(bodyText.match(EMAIL_REGEX) || [])].slice(0, 20);
    const phones = [...new Set(bodyText.match(PHONE_REGEX) || [])]
      .filter((p) => p.replace(/\D/g, "").length >= 7)
      .slice(0, 20);
    const prices = [...new Set(bodyText.match(PRICE_REGEX) || [])].slice(0, 30);
    const dates = [...new Set(bodyText.match(DATE_REGEX) || [])].slice(0, 20);

    // Extract links with context
    const links = $("a[href]")
      .map((_, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr("href"),
        isExternal: ($(el).attr("href") || "").startsWith("http"),
      }))
      .get()
      .filter((l) => l.text && l.href)
      .slice(0, 50);

    // Extract images
    const images = $("img[src]")
      .map((_, el) => ({
        src: $(el).attr("src"),
        alt: $(el).attr("alt") || null,
      }))
      .get()
      .filter((i) => i.src)
      .slice(0, 20);

    // Extract tables as structured data
    const tables: Record<string, string>[][] = [];
    $("table").each((_, table) => {
      const headers: string[] = [];
      $(table).find("th").each((_, th) => { headers.push($(th).text().trim()); });

      const rows: Record<string, string>[] = [];
      $(table).find("tr").each((_, tr) => {
        const cells: string[] = [];
        $(tr).find("td").each((_, td) => { cells.push($(td).text().trim()); });
        if (cells.length > 0) {
          const row: Record<string, string> = {};
          cells.forEach((cell, i) => {
            row[headers[i] || `col_${i}`] = cell;
          });
          rows.push(row);
        }
      });
      if (rows.length > 0) tables.push(rows);
    });

    return NextResponse.json({
      url,
      metadata: { title, description, ogImage, canonical, language },
      headings: headings.slice(0, 20),
      text: bodyText.slice(0, 8000),
      structured: {
        emails,
        phones,
        prices,
        dates,
        links_count: links.length,
        images_count: images.length,
        tables_count: tables.length,
      },
      links: links.slice(0, 30),
      images: images.slice(0, 10),
      tables: tables.slice(0, 5),
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
    accepts: { scheme: "exact", price: "$0.03", network, payTo },
    description: "Smart structured web scraper - extracts labeled data (emails, phones, prices, dates, tables, links) as agent-ready JSON",
  },
  resourceServer
);
