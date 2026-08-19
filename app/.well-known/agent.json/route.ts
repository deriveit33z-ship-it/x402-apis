import { NextResponse } from "next/server";

/**
 * A2A (Agent-to-Agent) Protocol Agent Card
 * Hosted at /.well-known/agent.json for inter-agent discovery.
 * AI agent frameworks discover capabilities via this endpoint.
 */
export async function GET() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  return NextResponse.json({
    name: "DeriveAI x402 APIs",
    description:
      "25 pay-per-request intelligence APIs for AI agents. Entity due diligence, competitive analysis, Gulf Arabic NLP, OSINT, web scraping, and data services. No API keys — uses x402 micropayments (USDC on Base mainnet).",
    url: baseUrl,
    version: "2.0.0",
    protocol: "x402",
    payment: {
      network: "eip155:8453",
      currency: "USDC",
      facilitator: "https://api.cdp.coinbase.com/platform/v2/x402",
    },
    mcp: {
      endpoint: `${baseUrl}/api/mcp`,
      transport: "streamable-http",
    },
    capabilities: [
      // === Premium Intelligence ($0.50 - $1.00) ===
      {
        name: "company_report",
        method: "GET",
        path: "/api/company-report",
        price: "$1.00",
        description:
          "Full company report — 25+ parallel checks: WHOIS, SSL, sanctions, web archive, security headers, email infra, DNS, CDN, subdomains, SEO, social presence, performance.",
        input: { domain: "string (e.g. example.com)" },
      },
      {
        name: "competitor_analysis",
        method: "GET",
        path: "/api/competitor-analysis",
        price: "$1.00",
        description:
          "Head-to-head competitive analysis across 8 dimensions: security, SEO, performance, SSL, email, social, infrastructure, domain maturity.",
        input: {
          domain1: "string (first domain)",
          domain2: "string (second domain)",
        },
      },
      {
        name: "due_diligence",
        method: "GET",
        path: "/api/due-diligence",
        price: "$0.50",
        description:
          "Entity due diligence — WHOIS, SSL, sanctions screening, web archive, web presence audit, trust score (0-100).",
        input: { domain: "string (or company name)" },
      },
      {
        name: "site_audit",
        method: "GET",
        path: "/api/site-audit",
        price: "$0.50",
        description:
          "Website security & SEO audit — security headers, SSL certificate, DNS config, SEO meta tags, Lighthouse performance, scored report (0-100).",
        input: { url: "string (full URL)" },
      },
      {
        name: "email_audit",
        method: "GET",
        path: "/api/email-audit",
        price: "$0.50",
        description:
          "Email infrastructure audit — SPF, DKIM (10 selectors), DMARC, MX records, blacklist status, DNSSEC, deliverability score (0-100).",
        input: { domain: "string" },
      },
      {
        name: "ip_intel",
        method: "GET",
        path: "/api/ip-intel",
        price: "$0.50",
        description:
          "IP intelligence — geolocation, ASN/ISP, reverse DNS, blacklist status, VPN/proxy/Tor detection, abuse history, risk score (0-100).",
        input: { ip: "string (IPv4 or IPv6)" },
      },
      {
        name: "username_osint",
        method: "GET",
        path: "/api/username-osint",
        price: "$0.50",
        description:
          "Username OSINT — checks 25+ platforms (GitHub, Reddit, Twitter, Instagram, npm, Steam), GitHub enrichment, domain availability, footprint score.",
        input: { username: "string (max 39 chars)" },
      },
      {
        name: "domain_infra",
        method: "GET",
        path: "/api/domain-infra",
        price: "$0.50",
        description:
          "Domain infrastructure map — full DNS records (A, AAAA, MX, NS, TXT, SOA, CAA), hosting provider, CDN detection, subdomain discovery, IP geolocation.",
        input: { domain: "string" },
      },
      {
        name: "brand_scout",
        method: "GET",
        path: "/api/brand-scout",
        price: "$0.50",
        description:
          "Brand availability scout — domain availability (12 TLDs), social handle availability (15+ platforms), trademark conflicts, alternative name suggestions.",
        input: { name: "string (2-30 chars)" },
      },
      // === NLP & Content Analysis ($0.005 - $0.01) ===
      {
        name: "arabic_sentiment",
        method: "POST",
        path: "/api/arabic/sentiment",
        price: "$0.01",
        description:
          "Gulf Arabic sentiment analysis — dialect-aware (Khaleeji, Egyptian, Levantine, MSA) with confidence scoring and keyword extraction.",
        input: { text: "string (Arabic text, max 10,000 chars)" },
      },
      {
        name: "arabizi_transliterate",
        method: "POST",
        path: "/api/arabic/arabizi",
        price: "$0.005",
        description:
          "Arabizi to Arabic transliteration — converts Latin-script Arabic (7abibi → حبيبي) with Gulf dialect optimization.",
        input: { text: "string (Arabizi text, max 5,000 chars)" },
      },
      {
        name: "detect_language",
        method: "POST",
        path: "/api/detect-language",
        price: "$0.005",
        description:
          "Language, script, and dialect detection — identifies Arabic dialects, Arabizi, mixed-language text.",
        input: { text: "string (max 10,000 chars)" },
      },
      {
        name: "profanity_filter",
        method: "POST",
        path: "/api/profanity-filter",
        price: "$0.005",
        description:
          "Multilingual toxicity filter — English, Arabic (Gulf), Spanish, French with severity scoring and cleaned text.",
        input: {
          text: "string (max 10,000 chars)",
          language: "string (optional, auto-detected)",
        },
      },
      // === Business & Verification ($0.003 - $0.03) ===
      {
        name: "legal_simplifier",
        method: "POST",
        path: "/api/legal-simplifier",
        price: "$0.01",
        description:
          "Legal jargon to plain English — explains clauses, detects red flags, extracts obligations, rates complexity/risk.",
        input: { text: "string (legal text, max 20,000 chars)" },
      },
      {
        name: "verify_email",
        method: "GET",
        path: "/api/verify-email",
        price: "$0.01",
        description:
          "Email verification — format validation, MX records, disposable/free/role-based detection, risk scoring.",
        input: { email: "string" },
      },
      {
        name: "domain_enrich",
        method: "GET",
        path: "/api/enrich",
        price: "$0.03",
        description:
          "Domain enrichment — company info, tech stack detection (React, WordPress, Shopify), social links, email addresses.",
        input: { domain: "string (e.g. example.com)" },
      },
      {
        name: "scrape_structured",
        method: "GET",
        path: "/api/scrape-structured",
        price: "$0.03",
        description:
          "Smart structured scraper — extracts labeled data (emails, phones, prices, dates, tables) as agent-ready JSON.",
        input: { url: "string" },
      },
      {
        name: "currency_convert",
        method: "GET",
        path: "/api/currency",
        price: "$0.003",
        description:
          "Currency conversion — 150+ currencies with real-time rates. Supports fiat and crypto (BTC, ETH).",
        input: {
          from: "string (default: USD)",
          to: "string (default: AED)",
          amount: "number (default: 1)",
        },
      },
      // === Data & Utilities ($0.005 - $0.02) ===
      {
        name: "web_scrape",
        method: "GET",
        path: "/api/scrape",
        price: "$0.02",
        description: "Web scraper — extracts text content, links, and metadata from any URL.",
        input: { url: "string" },
      },
      {
        name: "text_summarize",
        method: "POST",
        path: "/api/summarize",
        price: "$0.01",
        description:
          "Extractive text summarization — scores sentences by keyword frequency, returns top N sentences plus keywords.",
        input: {
          text: "string (max 50,000 chars)",
          max_sentences: "number (default: 5)",
        },
      },
      {
        name: "screenshot",
        method: "GET",
        path: "/api/screenshot",
        price: "$0.02",
        description:
          "Website screenshot — captures page as PNG with performance metrics (Lighthouse score, FCP, LCP, TBT).",
        input: {
          url: "string",
          format: "string (json or image, default: json)",
        },
      },
      {
        name: "crypto_data",
        method: "GET",
        path: "/api/data/crypto",
        price: "$0.005",
        description: "Real-time crypto price, volume, market cap, and 24h change.",
        input: {
          coin: "string (CoinGecko ID, default: bitcoin)",
          currency: "string (default: usd)",
        },
      },
      {
        name: "weather_data",
        method: "GET",
        path: "/api/data/weather",
        price: "$0.005",
        description: "Current weather conditions for any location worldwide.",
        input: {
          city: "string",
          lat: "number (optional)",
          lon: "number (optional)",
        },
      },
      {
        name: "gold_price",
        method: "GET",
        path: "/api/gold-price",
        price: "$0.005",
        description:
          "Gold prices per gram — 24K/22K/21K/18K across 10 currencies (USD, AED, EUR, GBP, INR, SAR, PKR, PHP, BDT, EGP).",
        input: {
          currency: "string (default: USD)",
          karat: "string (24/22/21/18 or all, default: all)",
        },
      },
      {
        name: "prayer_times",
        method: "GET",
        path: "/api/prayer-times",
        price: "$0.005",
        description:
          "Islamic prayer times — Fajr, Dhuhr, Asr, Maghrib, Isha for any city with Hijri date.",
        input: {
          city: "string",
          country: "string (optional)",
          date: "string (DD-MM-YYYY, optional)",
          method: "number (calculation method, optional)",
        },
      },
    ],
  });
}
