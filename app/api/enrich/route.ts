import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions";
import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Domain/Company Enrichment API - $0.03 per request
 * Returns company information, tech stack hints, DNS records, and social links for any domain.
 * AI agents use this for lead enrichment and research.
 */
const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Missing 'domain' query parameter" },
      { status: 400 }
    );
  }

  // Clean the domain
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();

  try {
    // Fetch the homepage to extract metadata
    const response = await fetch(`https://${cleanDomain}`, {
      headers: { "User-Agent": "x402-enrich/1.0 (paid-api)" },
      redirect: "follow",
    });

    const html = await response.text();

    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/is);

    // Detect tech stack from HTML hints
    const techStack: string[] = [];
    if (html.includes("next/static") || html.includes("__next")) techStack.push("Next.js");
    if (html.includes("__nuxt")) techStack.push("Nuxt.js");
    if (html.includes("wp-content")) techStack.push("WordPress");
    if (html.includes("shopify")) techStack.push("Shopify");
    if (html.includes("react")) techStack.push("React");
    if (html.includes("vue")) techStack.push("Vue.js");
    if (html.includes("angular")) techStack.push("Angular");
    if (html.includes("gatsby")) techStack.push("Gatsby");
    if (html.includes("webflow")) techStack.push("Webflow");
    if (html.includes("squarespace")) techStack.push("Squarespace");
    if (html.includes("wix.com")) techStack.push("Wix");
    if (html.includes("tailwind")) techStack.push("Tailwind CSS");
    if (html.includes("bootstrap")) techStack.push("Bootstrap");
    if (html.includes("cloudflare")) techStack.push("Cloudflare");
    if (html.includes("gtag") || html.includes("google-analytics")) techStack.push("Google Analytics");
    if (html.includes("hotjar")) techStack.push("Hotjar");
    if (html.includes("segment")) techStack.push("Segment");
    if (html.includes("intercom")) techStack.push("Intercom");
    if (html.includes("hubspot")) techStack.push("HubSpot");
    if (html.includes("stripe")) techStack.push("Stripe");

    // Extract social links
    const socialPatterns = [
      { name: "twitter", pattern: /https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+/g },
      { name: "linkedin", pattern: /https?:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+/g },
      { name: "github", pattern: /https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+/g },
      { name: "facebook", pattern: /https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._-]+/g },
      { name: "instagram", pattern: /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/g },
    ];

    const socials: Record<string, string> = {};
    for (const { name, pattern } of socialPatterns) {
      const match = html.match(pattern);
      if (match) socials[name] = match[0];
    }

    // Extract emails from page
    const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    const emails = [...new Set(emailMatches || [])].slice(0, 5);

    return NextResponse.json({
      domain: cleanDomain,
      title: titleMatch?.[1]?.trim() || null,
      description: descMatch?.[1]?.trim() || null,
      og_image: ogImageMatch?.[1] || null,
      tech_stack: [...new Set(techStack)],
      social_links: socials,
      emails,
      status: response.status,
      redirected_to: response.url !== `https://${cleanDomain}` ? response.url : null,
      enriched_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Could not reach ${cleanDomain}: ${message}` },
      { status: 502 }
    );
  }
};

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.03",
      network,
      payTo,
    },
    description: "Domain enrichment - company info, tech stack, social links, and emails for any domain",
  },
  resourceServer
);
