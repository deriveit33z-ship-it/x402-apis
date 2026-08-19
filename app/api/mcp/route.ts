import { NextRequest, NextResponse } from "next/server";

/**
 * MCP (Model Context Protocol) Server Endpoint
 *
 * This makes your APIs discoverable by Claude, ChatGPT, and other AI assistants.
 * It speaks JSON-RPC 2.0 over HTTP — the standard MCP Streamable HTTP transport.
 *
 * Implements:
 * - initialize: handshake with protocol version
 * - tools/list: returns all 7 tool definitions
 * - tools/call: executes a tool and returns the result
 *
 * These tools call your API logic directly (no payment layer) because MCP
 * is for discovery and testing. Real paid usage goes through x402 endpoints.
 */

const SERVER_INFO = {
  name: "x402-gcc-apis",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2025-03-26";

// Tool definitions — this is what AI assistants see when they browse your server
const TOOLS = [
  {
    name: "arabic_sentiment",
    description:
      "Analyze sentiment in Arabic text. Supports Gulf/Khaleeji, Egyptian, Levantine, and MSA dialects. Returns sentiment (positive/negative/neutral), confidence score, detected dialect, and keywords. Global LLMs hit ~45% accuracy on Gulf dialect — this tool is purpose-built for it.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Arabic text to analyze (max 10,000 characters)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "arabizi_translate",
    description:
      "Convert Arabizi (Latin-script Arabic like '7abibi', 'shlonk', '3aysh') to Arabic script (حبيبي، شلونك، عايش). Gulf dialect optimized. Handles number-to-letter mappings (3=ع, 7=ح, 5=خ, 8=ق, 9=ص).",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Arabizi text to transliterate (max 5,000 characters)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "web_scrape",
    description:
      "Extract text content, links, title, and metadata from any URL. Returns cleaned text (scripts/styles removed), page title, meta description, and up to 50 links.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Full URL to scrape (e.g., https://example.com)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "text_summarize",
    description:
      "Extractive text summarization. Scores sentences by keyword frequency and returns the most important ones in original order, plus top 10 keywords.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to summarize (max 50,000 characters)",
        },
        max_sentences: {
          type: "number",
          description: "Number of key sentences to extract (default: 5)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "crypto_data",
    description:
      "Real-time cryptocurrency market data: price, 24h volume, market cap, and 24h price change percentage. Supports thousands of coins via CoinGecko IDs.",
    inputSchema: {
      type: "object",
      properties: {
        coin: {
          type: "string",
          description: "CoinGecko coin ID (e.g., bitcoin, ethereum, solana)",
        },
        currency: {
          type: "string",
          description: "Fiat currency code (default: usd)",
        },
      },
      required: ["coin"],
    },
  },
  {
    name: "weather_data",
    description:
      "Current weather conditions for any city worldwide. Returns temperature, feels-like, humidity, precipitation, wind speed/direction, and weather condition description.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name (e.g., Dubai, Abu Dhabi, London)",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "domain_enrich",
    description:
      "Domain enrichment: returns company name, description, detected tech stack (React, WordPress, Shopify, etc.), social media links (Twitter, LinkedIn, GitHub), email addresses, and redirect info for any domain.",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Domain name to enrich (e.g., google.com, aramco.com)",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "scrape_structured",
    description:
      "Smart structured web scraper. Unlike basic scrapers that return raw text, this extracts and LABELS structured data: emails, phone numbers, prices, dates, tables, links, headings, and metadata. Returns agent-ready JSON — no further parsing needed.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Full URL to scrape and structure" },
      },
      required: ["url"],
    },
  },
  {
    name: "verify_email",
    description:
      "Email verification: validates format, checks domain exists, verifies MX records, detects disposable emails, free providers (Gmail, Yahoo), and role-based addresses (info@, admin@). Returns risk score.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Email address to verify" },
      },
      required: ["email"],
    },
  },
  {
    name: "prayer_times",
    description:
      "Islamic prayer times for any city worldwide: Fajr, Dhuhr, Asr, Maghrib, Isha. Includes sunrise, Hijri date, and multiple calculation methods (Umm Al-Qura, ISNA, MWL).",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name (e.g., Dubai, London, Jakarta)" },
        country: { type: "string", description: "Country name (optional)" },
        date: { type: "string", description: "Date in DD-MM-YYYY format (optional, defaults to today)" },
      },
      required: ["city"],
    },
  },
  {
    name: "profanity_filter",
    description:
      "Multilingual profanity and toxicity detection. Supports English, Arabic (Gulf dialect aware), Spanish, and French. Returns toxicity score, flagged words with categories (hate/sexual/violence/slur), severity rating, and cleaned text.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to check for profanity (max 10,000 chars)" },
        language: { type: "string", description: "Language code: en, ar, es, fr (auto-detected if not provided)" },
      },
      required: ["text"],
    },
  },
  {
    name: "legal_simplifier",
    description:
      "Legal jargon simplifier. Takes contract clauses, terms of service, or privacy policy text and returns: plain English explanations of legal terms, red flags, key obligations, complexity score, and risk level.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Legal text to analyze (max 20,000 chars)" },
      },
      required: ["text"],
    },
  },
  {
    name: "gold_price",
    description:
      "Current retail gold prices per gram in 24K/22K/21K/18K across 10 currencies (USD, AED, EUR, GBP, INR, SAR, PKR, PHP, BDT, EGP). Consumer retail pricing.",
    inputSchema: {
      type: "object",
      properties: {
        currency: { type: "string", description: "Currency code: USD, AED, EUR, GBP, INR, SAR, PKR, PHP, BDT, EGP (default: USD)" },
        karat: { type: "string", description: "Gold karat: 24K, 22K, 21K, 18K, or 'all' (default: all)" },
      },
    },
  },
  {
    name: "detect_language",
    description:
      "Detects language, script type, and Arabic dialect from any text. Supports Arabic (MSA, Gulf, Egyptian, Levantine, Maghrebi), English, French, Spanish, Turkish, Hindi. Also detects Arabizi (Latin-script Arabic) and mixed-language text.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to analyze (max 10,000 chars)" },
      },
      required: ["text"],
    },
  },
  {
    name: "currency_convert",
    description:
      "Currency conversion with real-time rates. Supports 150+ currencies including fiat (USD, EUR, GBP, AED, SAR, INR, PKR, PHP) and crypto (BTC, ETH). Returns rate, converted amount, and inverse rate.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Source currency code (default: USD)" },
        to: { type: "string", description: "Target currency code (default: AED)" },
        amount: { type: "string", description: "Amount to convert (default: 1)" },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "screenshot",
    description:
      "Captures a website screenshot as PNG/JPEG with performance metrics. Returns base64 image, Lighthouse performance score, First Contentful Paint, Largest Contentful Paint, and Total Blocking Time.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to screenshot" },
        format: { type: "string", description: "'json' for base64+metrics, 'image' for raw image (default: json)" },
      },
      required: ["url"],
    },
  },
  {
    name: "due_diligence",
    description:
      "Entity due diligence report. One call replaces 10+ separate lookups. Pass a domain or company name, get: WHOIS data, SSL certificate analysis, sanctions screening (OpenSanctions), web archive history, web presence audit, social links, contact info, risk signals, and a confidence-scored trust verdict (0-100). Costs $0.50 because it runs 5+ parallel checks and cross-references the results.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Domain to investigate (e.g., google.com)" },
        company: { type: "string", description: "Company name to screen (e.g., Google LLC)" },
      },
    },
  },
  {
    name: "site_audit",
    description:
      "Website security and SEO audit. Runs 5 parallel checks: security headers (HSTS, CSP, X-Frame-Options), SSL certificate grade, DNS configuration (DNSSEC, SPF), SEO analysis (title, meta, OG tags, headings, images), and Lighthouse performance metrics. Returns scored report (0-100) with actionable findings. $0.50 per audit.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to audit (e.g., https://example.com)" },
      },
      required: ["url"],
    },
  },
  {
    name: "email_audit",
    description: "Email infrastructure audit. Checks SPF, DKIM (10 selectors), DMARC, MX records, blacklist status (8 DNSBLs), and DNSSEC. Returns deliverability score (0-100). All DNS-based, zero API keys.",
    inputSchema: { type: "object", properties: { domain: { type: "string", description: "Domain to audit (e.g., gmail.com)" } }, required: ["domain"] },
  },
  {
    name: "ip_intel",
    description: "IP address threat intelligence. Geolocation, ASN/ISP, reverse DNS, blacklist status (8 DNSBLs), VPN/proxy/Tor detection, abuse history. Cross-referenced risk score (0-100).",
    inputSchema: { type: "object", properties: { ip: { type: "string", description: "IPv4 address (e.g., 8.8.8.8)" } }, required: ["ip"] },
  },
  {
    name: "username_osint",
    description: "Username OSINT report. Checks 25+ platforms (GitHub, Reddit, Twitter, Instagram, npm, Steam, etc.) for a username. Categorizes by type, enriches GitHub profile, checks domain availability.",
    inputSchema: { type: "object", properties: { username: { type: "string", description: "Username to investigate" } }, required: ["username"] },
  },
  {
    name: "domain_infra",
    description: "Domain infrastructure map. Full DNS records (A, AAAA, MX, NS, TXT, SOA, CAA), hosting provider, CDN detection, subdomain discovery via DNS brute-force and Certificate Transparency, IP geolocation.",
    inputSchema: { type: "object", properties: { domain: { type: "string", description: "Domain to map (e.g., google.com)" } }, required: ["domain"] },
  },
  {
    name: "brand_scout",
    description: "Brand availability scout. Checks domain availability across 12 TLDs, social handle availability on 15+ platforms, trademark conflicts, and alternative name suggestions. Scored report (0-100).",
    inputSchema: { type: "object", properties: { name: { type: "string", description: "Brand/business name to check" } }, required: ["name"] },
  },
  {
    name: "competitor_analysis",
    description: "Competitive analysis report ($1.00). Pass two domains, get a head-to-head comparison across 8 dimensions: security headers, SEO quality, Lighthouse performance, SSL health, email security (SPF/DMARC), social presence, infrastructure (CDN/IPv6), and domain maturity. Returns winner per category and overall verdict.",
    inputSchema: { type: "object", properties: { domain1: { type: "string", description: "First domain (e.g., google.com)" }, domain2: { type: "string", description: "Second domain (e.g., bing.com)" } }, required: ["domain1", "domain2"] },
  },
  {
    name: "company_report",
    description: "Full company report ($1.00). The mega-report: 25+ parallel checks in one call. WHOIS/domain age, SSL certificate, sanctions screening, web archive history, security headers (7 types), email infrastructure (SPF/DKIM/DMARC/blacklists), full DNS records, CDN detection, subdomain discovery, SEO analysis, social presence, tech stack, Lighthouse performance, legal pages. Returns scored verdict (0-100).",
    inputSchema: { type: "object", properties: { domain: { type: "string", description: "Company domain to investigate (e.g., stripe.com)" } }, required: ["domain"] },
  },
];

// Base URL for internal API calls
function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Execute a tool by calling the corresponding internal API endpoint
async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const base = getBaseUrl();
  let res: Response;

  switch (name) {
    case "arabic_sentiment":
      res = await fetch(`${base}/api/arabic/sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MCP-Internal": "true" },
        body: JSON.stringify({ text: args.text }),
      });
      break;

    case "arabizi_translate":
      res = await fetch(`${base}/api/arabic/arabizi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MCP-Internal": "true" },
        body: JSON.stringify({ text: args.text }),
      });
      break;

    case "web_scrape":
      res = await fetch(
        `${base}/api/scrape?url=${encodeURIComponent(args.url as string)}`,
        { headers: { "X-MCP-Internal": "true" } }
      );
      break;

    case "text_summarize":
      res = await fetch(`${base}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MCP-Internal": "true" },
        body: JSON.stringify({
          text: args.text,
          max_sentences: args.max_sentences ?? 5,
        }),
      });
      break;

    case "crypto_data":
      res = await fetch(
        `${base}/api/data/crypto?coin=${encodeURIComponent(args.coin as string)}&currency=${encodeURIComponent((args.currency as string) || "usd")}`,
        { headers: { "X-MCP-Internal": "true" } }
      );
      break;

    case "weather_data":
      res = await fetch(
        `${base}/api/data/weather?city=${encodeURIComponent(args.city as string)}`,
        { headers: { "X-MCP-Internal": "true" } }
      );
      break;

    case "domain_enrich":
      res = await fetch(
        `${base}/api/enrich?domain=${encodeURIComponent(args.domain as string)}`,
        { headers: { "X-MCP-Internal": "true" } }
      );
      break;

    case "scrape_structured":
      res = await fetch(
        `${base}/api/scrape-structured?url=${encodeURIComponent(args.url as string)}`,
        { headers: { "X-MCP-Internal": "true" } }
      );
      break;

    case "verify_email":
      res = await fetch(
        `${base}/api/verify-email?email=${encodeURIComponent(args.email as string)}`,
        { headers: { "X-MCP-Internal": "true" } }
      );
      break;

    case "prayer_times": {
      const params = new URLSearchParams({ city: args.city as string });
      if (args.country) params.set("country", args.country as string);
      if (args.date) params.set("date", args.date as string);
      res = await fetch(`${base}/api/prayer-times?${params}`, { headers: { "X-MCP-Internal": "true" } });
      break;
    }

    case "profanity_filter":
      res = await fetch(`${base}/api/profanity-filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MCP-Internal": "true" },
        body: JSON.stringify({ text: args.text, language: args.language }),
      });
      break;

    case "legal_simplifier":
      res = await fetch(`${base}/api/legal-simplifier`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MCP-Internal": "true" },
        body: JSON.stringify({ text: args.text }),
      });
      break;

    case "gold_price": {
      const goldParams = new URLSearchParams();
      if (args.currency) goldParams.set("currency", args.currency as string);
      if (args.karat) goldParams.set("karat", args.karat as string);
      res = await fetch(`${base}/api/gold-price?${goldParams}`, { headers: { "X-MCP-Internal": "true" } });
      break;
    }

    case "detect_language":
      res = await fetch(`${base}/api/detect-language`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MCP-Internal": "true" },
        body: JSON.stringify({ text: args.text }),
      });
      break;

    case "currency_convert": {
      const currParams = new URLSearchParams();
      if (args.from) currParams.set("from", args.from as string);
      if (args.to) currParams.set("to", args.to as string);
      if (args.amount) currParams.set("amount", args.amount as string);
      res = await fetch(`${base}/api/currency?${currParams}`, { headers: { "X-MCP-Internal": "true" } });
      break;
    }

    case "screenshot": {
      const ssParams = new URLSearchParams({ url: args.url as string });
      if (args.format) ssParams.set("format", args.format as string);
      res = await fetch(`${base}/api/screenshot?${ssParams}`, { headers: { "X-MCP-Internal": "true" } });
      break;
    }

    case "due_diligence": {
      const ddParams = new URLSearchParams();
      if (args.domain) ddParams.set("domain", args.domain as string);
      if (args.company) ddParams.set("company", args.company as string);
      res = await fetch(`${base}/api/due-diligence?${ddParams}`, { headers: { "X-MCP-Internal": "true" } });
      break;
    }

    case "site_audit":
      res = await fetch(
        `${base}/api/site-audit?url=${encodeURIComponent(args.url as string)}`,
        { headers: { "X-MCP-Internal": "true" } }
      );
      break;

    case "email_audit":
      res = await fetch(`${base}/api/email-audit?domain=${encodeURIComponent(args.domain as string)}`, { headers: { "X-MCP-Internal": "true" } });
      break;

    case "ip_intel":
      res = await fetch(`${base}/api/ip-intel?ip=${encodeURIComponent(args.ip as string)}`, { headers: { "X-MCP-Internal": "true" } });
      break;

    case "username_osint":
      res = await fetch(`${base}/api/username-osint?username=${encodeURIComponent(args.username as string)}`, { headers: { "X-MCP-Internal": "true" } });
      break;

    case "domain_infra":
      res = await fetch(`${base}/api/domain-infra?domain=${encodeURIComponent(args.domain as string)}`, { headers: { "X-MCP-Internal": "true" } });
      break;

    case "brand_scout":
      res = await fetch(`${base}/api/brand-scout?name=${encodeURIComponent(args.name as string)}`, { headers: { "X-MCP-Internal": "true" } });
      break;

    case "competitor_analysis":
      res = await fetch(`${base}/api/competitor-analysis?domain1=${encodeURIComponent(args.domain1 as string)}&domain2=${encodeURIComponent(args.domain2 as string)}`, { headers: { "X-MCP-Internal": "true" } });
      break;

    case "company_report":
      res = await fetch(`${base}/api/company-report?domain=${encodeURIComponent(args.domain as string)}`, { headers: { "X-MCP-Internal": "true" } });
      break;

    default:
      return {
        content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
      };
  }

  // If we get a 402, the MCP call is hitting the payment layer.
  // Return a helpful message directing to the x402 endpoint.
  if (res.status === 402) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            note: "This tool requires x402 payment for full access.",
            endpoint: `https://x402-apis-eta.vercel.app${res.url.replace(base, "")}`,
            price: TOOLS.find((t) => t.name === name)?.description || "",
            protocol: "x402 (USDC on Base)",
          }),
        },
      ],
    };
  }

  const data = await res.json();
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

// Handle JSON-RPC 2.0 requests
function handleJsonRpc(method: string, params: Record<string, unknown> | undefined) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      };

    case "notifications/initialized":
      // Client confirms initialization — no response needed
      return null;

    case "tools/list":
      return { tools: TOOLS };

    case "tools/call": {
      // This is handled async in the POST handler
      return null;
    }

    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Handle single JSON-RPC request
  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== "2.0") {
    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request — must be JSON-RPC 2.0" } },
      { status: 400 }
    );
  }

  // Handle tool calls separately (they're async)
  if (method === "tools/call") {
    const toolName = params?.name as string;
    const toolArgs = (params?.arguments ?? {}) as Record<string, unknown>;

    const tool = TOOLS.find((t) => t.name === toolName);
    if (!tool) {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: `Unknown tool: ${toolName}` },
      });
    }

    const result = await executeTool(toolName, toolArgs);
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result,
    });
  }

  // Handle other methods
  const result = handleJsonRpc(method, params);

  // Notifications don't get responses
  if (id === undefined || id === null) {
    return new Response(null, { status: 204 });
  }

  if (result === null) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }

  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

// GET — return server info for discovery
export async function GET() {
  return NextResponse.json({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    protocol: "MCP",
    protocolVersion: PROTOCOL_VERSION,
    transport: "streamable-http",
    tools: TOOLS.length,
    description:
      "Gulf Arabic NLP, web scraping, crypto data, weather, and domain enrichment. Pay-per-request via x402 (USDC on Base).",
  });
}
