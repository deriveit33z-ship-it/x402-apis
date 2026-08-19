# DeriveAI x402 APIs

**25 pay-per-request intelligence APIs for AI agents. No API keys. No accounts. Just pay and use.**

Your agent sends USDC on Base, gets data back. That's it.

## Install in Claude Code / Cursor / Windsurf

Add this to your MCP config:

```json
{
  "mcpServers": {
    "deriveai": {
      "url": "https://x402-apis-eta.vercel.app/api/mcp"
    }
  }
}
```

Done. Your AI can now call any of the 25 endpoints.

## What's Available

### Premium Intelligence

| Endpoint | Price | What it does |
|----------|-------|-------------|
| `/api/company-report` | $1.00 | Full company report — 25+ parallel checks in one call |
| `/api/competitor-analysis` | $1.00 | Head-to-head comparison across 8 dimensions |
| `/api/due-diligence` | $0.50 | Entity trust scoring — WHOIS, SSL, sanctions, web archive |
| `/api/site-audit` | $0.50 | Security headers, SSL, DNS, SEO, Lighthouse performance |
| `/api/email-audit` | $0.50 | SPF, DKIM, DMARC, MX, blacklist, deliverability score |
| `/api/ip-intel` | $0.50 | Geolocation, ASN, reverse DNS, VPN/proxy/Tor detection |
| `/api/username-osint` | $0.50 | Check 25+ platforms, GitHub enrichment, footprint score |
| `/api/domain-infra` | $0.50 | Full DNS dump, CDN detection, subdomain discovery |
| `/api/brand-scout` | $0.50 | Domain + social handle availability across 25+ platforms |

### NLP & Content

| Endpoint | Price | What it does |
|----------|-------|-------------|
| `/api/arabic/sentiment` | $0.01 | Gulf Arabic sentiment analysis (Khaleeji, Egyptian, Levantine, MSA) |
| `/api/arabic/arabizi` | $0.005 | Arabizi to Arabic script (7abibi → حبيبي) |
| `/api/detect-language` | $0.005 | Language, script, and dialect detection |
| `/api/profanity-filter` | $0.005 | Multilingual toxicity filter with severity scoring |

### Business & Verification

| Endpoint | Price | What it does |
|----------|-------|-------------|
| `/api/legal-simplifier` | $0.01 | Legal jargon to plain English with red flag detection |
| `/api/verify-email` | $0.01 | Email validation, disposable/free detection, risk scoring |
| `/api/enrich` | $0.03 | Domain enrichment — tech stack, social links, company info |
| `/api/scrape-structured` | $0.03 | Extract structured data (emails, phones, prices) as JSON |
| `/api/currency` | $0.003 | 150+ currencies, real-time rates, fiat and crypto |

### Data & Utilities

| Endpoint | Price | What it does |
|----------|-------|-------------|
| `/api/scrape` | $0.02 | Extract text, links, and metadata from any URL |
| `/api/screenshot` | $0.02 | Website screenshot with Lighthouse performance metrics |
| `/api/summarize` | $0.01 | Extractive text summarization with keyword extraction |
| `/api/data/crypto` | $0.005 | Real-time crypto price, volume, market cap, 24h change |
| `/api/data/weather` | $0.005 | Current weather for any location worldwide |
| `/api/gold-price` | $0.005 | Gold price per gram (24K/22K/21K/18K) in 10 currencies |
| `/api/prayer-times` | $0.005 | Islamic prayer times with Hijri date for any city |

## How Payment Works

This API uses the [x402 protocol](https://www.x402.org/). When your agent calls an endpoint:

1. Server responds with `402 Payment Required` and a price
2. Your agent signs a USDC payment on Base
3. Agent resends the request with the payment header
4. Server verifies payment and returns the data

No API keys. No rate limits. No accounts. Just micropayments.

## Quick Examples

```bash
# Check a company's trust score
GET /api/due-diligence?domain=example.com

# Convert currency
GET /api/currency?from=USD&to=AED&amount=100

# Analyze Arabic sentiment
POST /api/arabic/sentiment
{"text": "الخدمة ممتازة والأسعار معقولة"}

# Full competitive analysis
GET /api/competitor-analysis?domain1=google.com&domain2=bing.com
```

## Links

- **MCP Registry:** [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/?search=deriveit)
- **Agent Discovery:** `https://x402-apis-eta.vercel.app/.well-known/agent.json`
- **x402 Protocol:** [x402.org](https://www.x402.org/)

## License

MIT
