import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "x402 GCC Data APIs",
      description: "Pay-per-request data APIs optimized for GCC/Middle East. Gulf Arabic NLP, web scraping, crypto data, weather, and domain enrichment. All endpoints use x402 micropayments (USDC on Base).",
      version: "1.0.0",
    },
    servers: [
      { url: "https://x402-apis-eta.vercel.app" },
    ],
    paths: {
      "/api/arabic/sentiment": {
        post: {
          summary: "Gulf Arabic Sentiment Analysis",
          description: "Analyzes sentiment in Arabic text with special handling for Gulf/Khaleeji dialect. Global LLMs hit ~45% accuracy on Gulf dialect — this API is purpose-built for it.",
          operationId: "arabicSentiment",
          "x-x402": { price: "$0.01", network: "eip155:8453", scheme: "exact" },
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string", description: "Arabic text to analyze", maxLength: 10000 } } } } },
          },
          responses: { "200": { description: "Sentiment analysis result" }, "402": { description: "Payment required" } },
        },
      },
      "/api/arabic/arabizi": {
        post: {
          summary: "Arabizi to Arabic Transliteration",
          description: "Converts Arabizi (Latin-script Arabic like 7abibi, shlonk, 3aysh) to Arabic script. Gulf dialect optimized. No other pay-per-call API exists for this.",
          operationId: "arabiziTransliterate",
          "x-x402": { price: "$0.005", network: "eip155:8453", scheme: "exact" },
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string", description: "Arabizi text to convert", maxLength: 5000 } } } } },
          },
          responses: { "200": { description: "Transliterated Arabic text" }, "402": { description: "Payment required" } },
        },
      },
      "/api/scrape": {
        get: {
          summary: "Web Scraper",
          description: "Extracts text content, links, and metadata from any URL.",
          operationId: "webScrape",
          "x-x402": { price: "$0.02", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "url", in: "query", required: true, schema: { type: "string" }, description: "URL to scrape" }],
          responses: { "200": { description: "Scraped page content" }, "402": { description: "Payment required" } },
        },
      },
      "/api/summarize": {
        post: {
          summary: "Text Summarizer",
          description: "Extractive text summarization with keyword extraction.",
          operationId: "textSummarize",
          "x-x402": { price: "$0.01", network: "eip155:8453", scheme: "exact" },
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string", maxLength: 50000 }, max_sentences: { type: "number", default: 5 } } } } },
          },
          responses: { "200": { description: "Summary with keywords" }, "402": { description: "Payment required" } },
        },
      },
      "/api/data/crypto": {
        get: {
          summary: "Crypto Market Data",
          description: "Real-time price, volume, market cap, and 24h change for any cryptocurrency.",
          operationId: "cryptoData",
          "x-x402": { price: "$0.005", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "coin", in: "query", schema: { type: "string", default: "bitcoin" }, description: "CoinGecko coin ID" },
            { name: "currency", in: "query", schema: { type: "string", default: "usd" }, description: "Fiat currency" },
          ],
          responses: { "200": { description: "Market data" }, "402": { description: "Payment required" } },
        },
      },
      "/api/data/weather": {
        get: {
          summary: "Weather Data",
          description: "Current weather conditions for any location worldwide.",
          operationId: "weatherData",
          "x-x402": { price: "$0.005", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "city", in: "query", schema: { type: "string" }, description: "City name" },
            { name: "lat", in: "query", schema: { type: "string" }, description: "Latitude (optional)" },
            { name: "lon", in: "query", schema: { type: "string" }, description: "Longitude (optional)" },
          ],
          responses: { "200": { description: "Weather conditions" }, "402": { description: "Payment required" } },
        },
      },
      "/api/enrich": {
        get: {
          summary: "Domain Enrichment",
          description: "Returns company info, tech stack, social links, and emails for any domain.",
          operationId: "domainEnrich",
          "x-x402": { price: "$0.03", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "domain", in: "query", required: true, schema: { type: "string" }, description: "Domain to enrich" }],
          responses: { "200": { description: "Domain enrichment data" }, "402": { description: "Payment required" } },
        },
      },
      "/api/scrape-structured": {
        get: {
          summary: "Smart Structured Web Scraper",
          description: "Extracts and labels structured data from any URL: emails, phone numbers, prices, dates, tables, links, headings, metadata. Returns agent-ready JSON.",
          operationId: "scrapeStructured",
          "x-x402": { price: "$0.03", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "url", in: "query", required: true, schema: { type: "string" }, description: "URL to scrape" }],
          responses: { "200": { description: "Structured page data" }, "402": { description: "Payment required" } },
        },
      },
      "/api/verify-email": {
        get: {
          summary: "Email Verification",
          description: "Validates email: format, domain, MX records, disposable detection, free provider detection, role-based detection, risk scoring.",
          operationId: "verifyEmail",
          "x-x402": { price: "$0.01", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "email", in: "query", required: true, schema: { type: "string" }, description: "Email to verify" }],
          responses: { "200": { description: "Verification result" }, "402": { description: "Payment required" } },
        },
      },
      "/api/prayer-times": {
        get: {
          summary: "Islamic Prayer Times",
          description: "Prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for any city worldwide with Hijri date and multiple calculation methods.",
          operationId: "prayerTimes",
          "x-x402": { price: "$0.005", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "city", in: "query", required: true, schema: { type: "string" }, description: "City name" },
            { name: "country", in: "query", schema: { type: "string" }, description: "Country (optional)" },
            { name: "date", in: "query", schema: { type: "string" }, description: "DD-MM-YYYY (optional)" },
          ],
          responses: { "200": { description: "Prayer times" }, "402": { description: "Payment required" } },
        },
      },
      "/api/profanity-filter": {
        post: {
          summary: "Multilingual Profanity Filter",
          description: "Detects offensive content in English, Arabic (Gulf dialect), Spanish, French. Returns toxicity score, flagged words, categories, severity, and cleaned text.",
          operationId: "profanityFilter",
          "x-x402": { price: "$0.005", network: "eip155:8453", scheme: "exact" },
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string", maxLength: 10000 }, language: { type: "string" } } } } },
          },
          responses: { "200": { description: "Toxicity analysis" }, "402": { description: "Payment required" } },
        },
      },
      "/api/legal-simplifier": {
        post: {
          summary: "Legal Jargon Simplifier",
          description: "Explains contract clauses in plain English. Detects red flags, extracts obligations, rates complexity, and identifies risk level.",
          operationId: "legalSimplifier",
          "x-x402": { price: "$0.01", network: "eip155:8453", scheme: "exact" },
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string", maxLength: 20000 } } } } },
          },
          responses: { "200": { description: "Legal analysis" }, "402": { description: "Payment required" } },
        },
      },
      "/api/gold-price": {
        get: {
          summary: "Gold Prices",
          description: "Current retail gold price per gram in 24K/22K/21K/18K across 10 currencies. Consumer pricing for UAE gold market and remittance corridors.",
          operationId: "goldPrice",
          "x-x402": { price: "$0.005", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "currency", in: "query", schema: { type: "string", default: "USD" }, description: "Currency: USD, AED, EUR, GBP, INR, SAR, PKR, PHP, BDT, EGP" },
            { name: "karat", in: "query", schema: { type: "string", default: "all" }, description: "Karat: 24K, 22K, 21K, 18K, or all" },
          ],
          responses: { "200": { description: "Gold prices" }, "402": { description: "Payment required" } },
        },
      },
      "/api/detect-language": {
        post: {
          summary: "Language & Script Detector",
          description: "Detects language, script, Arabic dialect (Gulf/Egyptian/Levantine/Maghrebi/MSA), Arabizi, and mixed-language text.",
          operationId: "detectLanguage",
          "x-x402": { price: "$0.005", network: "eip155:8453", scheme: "exact" },
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string", maxLength: 10000 } } } } },
          },
          responses: { "200": { description: "Language detection result" }, "402": { description: "Payment required" } },
        },
      },
      "/api/currency": {
        get: {
          summary: "Currency Conversion",
          description: "Real-time currency conversion. 150+ currencies including fiat and crypto.",
          operationId: "currencyConvert",
          "x-x402": { price: "$0.003", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "from", in: "query", required: true, schema: { type: "string" }, description: "Source currency (e.g., USD)" },
            { name: "to", in: "query", required: true, schema: { type: "string" }, description: "Target currency (e.g., AED)" },
            { name: "amount", in: "query", schema: { type: "string", default: "1" }, description: "Amount to convert" },
          ],
          responses: { "200": { description: "Conversion result" }, "402": { description: "Payment required" } },
        },
      },
      "/api/screenshot": {
        get: {
          summary: "Website Screenshot",
          description: "Captures website screenshot with Lighthouse performance metrics.",
          operationId: "screenshot",
          "x-x402": { price: "$0.02", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "url", in: "query", required: true, schema: { type: "string" }, description: "URL to screenshot" },
            { name: "format", in: "query", schema: { type: "string", default: "json" }, description: "json or image" },
          ],
          responses: { "200": { description: "Screenshot data" }, "402": { description: "Payment required" } },
        },
      },
      "/api/due-diligence": {
        get: {
          summary: "Entity Due Diligence Report",
          description: "One call replaces 10+ lookups. WHOIS, SSL, sanctions screening (OpenSanctions), web archive, web presence audit, and trust score (0-100) for any domain or company.",
          operationId: "dueDiligence",
          "x-x402": { price: "$0.50", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "domain", in: "query", schema: { type: "string" }, description: "Domain to investigate (e.g., google.com)" },
            { name: "company", in: "query", schema: { type: "string" }, description: "Company name to screen" },
          ],
          responses: { "200": { description: "Due diligence report with trust score" }, "402": { description: "Payment required" } },
        },
      },
      "/api/site-audit": {
        get: {
          summary: "Website Security & SEO Audit",
          description: "Full site audit: security headers, SSL grade, DNS config, SEO meta analysis, Lighthouse performance. 5 parallel checks with scored report (0-100).",
          operationId: "siteAudit",
          "x-x402": { price: "$0.50", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "url", in: "query", required: true, schema: { type: "string" }, description: "URL to audit" },
          ],
          responses: { "200": { description: "Site audit report" }, "402": { description: "Payment required" } },
        },
      },
      "/api/email-audit": {
        get: {
          summary: "Email Infrastructure Audit",
          description: "SPF, DKIM, DMARC, MX records, blacklist checking, DNSSEC. Full deliverability score (0-100).",
          operationId: "emailAudit",
          "x-x402": { price: "$0.50", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "domain", in: "query", required: true, schema: { type: "string" }, description: "Domain to audit" }],
          responses: { "200": { description: "Email audit report" }, "402": { description: "Payment required" } },
        },
      },
      "/api/ip-intel": {
        get: {
          summary: "IP Address Intelligence",
          description: "Geolocation, ASN/ISP, reverse DNS, blacklist status, VPN/proxy/Tor detection, abuse history. Risk score (0-100).",
          operationId: "ipIntel",
          "x-x402": { price: "$0.50", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "ip", in: "query", required: true, schema: { type: "string" }, description: "IPv4 address" }],
          responses: { "200": { description: "IP intelligence report" }, "402": { description: "Payment required" } },
        },
      },
      "/api/username-osint": {
        get: {
          summary: "Username OSINT Report",
          description: "Checks 25+ platforms for a username. Categories, GitHub enrichment, domain availability. Footprint score.",
          operationId: "usernameOsint",
          "x-x402": { price: "$0.50", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "username", in: "query", required: true, schema: { type: "string" }, description: "Username to investigate" }],
          responses: { "200": { description: "OSINT report" }, "402": { description: "Payment required" } },
        },
      },
      "/api/domain-infra": {
        get: {
          summary: "Domain Infrastructure Map",
          description: "Full DNS records, hosting provider, CDN detection, subdomain discovery (DNS + Certificate Transparency), IP geolocation.",
          operationId: "domainInfra",
          "x-x402": { price: "$0.50", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "domain", in: "query", required: true, schema: { type: "string" }, description: "Domain to map" }],
          responses: { "200": { description: "Infrastructure map" }, "402": { description: "Payment required" } },
        },
      },
      "/api/brand-scout": {
        get: {
          summary: "Brand Availability Scout",
          description: "Domain availability (12 TLDs), social handle availability (15+ platforms), trademark conflicts, alternative names. Availability score (0-100).",
          operationId: "brandScout",
          "x-x402": { price: "$0.50", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "name", in: "query", required: true, schema: { type: "string" }, description: "Brand/business name" }],
          responses: { "200": { description: "Brand availability report" }, "402": { description: "Payment required" } },
        },
      },
      "/api/competitor-analysis": {
        get: {
          summary: "Competitive Analysis Report",
          description: "Head-to-head comparison of two domains across 8 dimensions: security, SEO, performance, SSL, email security, social presence, infrastructure, domain maturity. $1.00 per report.",
          operationId: "competitorAnalysis",
          "x-x402": { price: "$1.00", network: "eip155:8453", scheme: "exact" },
          parameters: [
            { name: "domain1", in: "query", required: true, schema: { type: "string" }, description: "First domain" },
            { name: "domain2", in: "query", required: true, schema: { type: "string" }, description: "Second domain" },
          ],
          responses: { "200": { description: "Competitive analysis report" }, "402": { description: "Payment required" } },
        },
      },
      "/api/company-report": {
        get: {
          summary: "Full Company Report",
          description: "The mega-report: 25+ parallel checks. WHOIS, SSL, sanctions, web archive, security headers, email (SPF/DKIM/DMARC/blacklists), DNS, CDN, subdomains, SEO, social, tech stack, Lighthouse, legal pages. Scored verdict (0-100).",
          operationId: "companyReport",
          "x-x402": { price: "$1.00", network: "eip155:8453", scheme: "exact" },
          parameters: [{ name: "domain", in: "query", required: true, schema: { type: "string" }, description: "Company domain to investigate" }],
          responses: { "200": { description: "Full company report" }, "402": { description: "Payment required" } },
        },
      },
    },
  });
}
