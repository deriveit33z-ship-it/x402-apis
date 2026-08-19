export default function Home() {
  const premiumApis = [
    { method: "GET", path: "/api/due-diligence?domain=example.com", price: "$0.50", description: "Entity due diligence — WHOIS, SSL, sanctions, web archive, web presence, trust score (0-100)" },
    { method: "GET", path: "/api/site-audit?url=https://example.com", price: "$0.50", description: "Website security & SEO audit — headers, SSL, DNS, SEO meta, Lighthouse performance" },
    { method: "GET", path: "/api/email-audit?domain=example.com", price: "$0.50", description: "Email infrastructure audit — SPF, DKIM, DMARC, MX, blacklists, DNSSEC, deliverability score" },
    { method: "GET", path: "/api/ip-intel?ip=8.8.8.8", price: "$0.50", description: "IP threat intelligence — geolocation, ASN, reverse DNS, blacklists, VPN/proxy/Tor detection" },
    { method: "GET", path: "/api/username-osint?username=example", price: "$0.50", description: "Username OSINT — checks 25+ platforms, GitHub enrichment, domain availability, footprint score" },
    { method: "GET", path: "/api/domain-infra?domain=example.com", price: "$0.50", description: "Domain infrastructure map — full DNS, hosting, CDN, subdomain discovery, IP geolocation" },
    { method: "GET", path: "/api/brand-scout?name=example", price: "$0.50", description: "Brand availability — 12 TLDs, 15+ social platforms, trademark conflicts, go/no-go score" },
    { method: "GET", path: "/api/competitor-analysis?domain1=a.com&domain2=b.com", price: "$1.00", description: "Competitive analysis — head-to-head across 8 dimensions: security, SEO, performance, SSL, email, social, infra, domain age" },
    { method: "GET", path: "/api/company-report?domain=example.com", price: "$1.00", description: "Full company report — 25+ checks: WHOIS, SSL, sanctions, email infra, DNS, CDN, subdomains, SEO, social, performance. Mega-report." },
  ];

  const nlpApis = [
    { method: "POST", path: "/api/arabic/sentiment", price: "$0.01", description: "Gulf Arabic sentiment analysis - Khaleeji, Egyptian, Levantine, MSA" },
    { method: "POST", path: "/api/arabic/arabizi", price: "$0.005", description: "Arabizi to Arabic transliteration (7abibi → حبيبي)" },
    { method: "POST", path: "/api/detect-language", price: "$0.005", description: "Language, script, and Arabic dialect detection + Arabizi detection" },
    { method: "POST", path: "/api/profanity-filter", price: "$0.005", description: "Multilingual toxicity filter (EN, AR Gulf, ES, FR) with severity scoring" },
  ];

  const businessApis = [
    { method: "POST", path: "/api/legal-simplifier", price: "$0.01", description: "Legal jargon → plain English with red flags and obligation extraction" },
    { method: "GET", path: "/api/verify-email?email=test@gmail.com", price: "$0.01", description: "Email verification - MX, disposable, free provider, risk scoring" },
    { method: "GET", path: "/api/enrich?domain=example.com", price: "$0.03", description: "Domain enrichment - tech stack, social links, emails, company info" },
    { method: "GET", path: "/api/currency?from=USD&to=AED&amount=100", price: "$0.003", description: "Currency conversion - 150+ currencies, real-time rates" },
  ];

  const dataApis = [
    { method: "GET", path: "/api/scrape-structured?url=https://example.com", price: "$0.03", description: "Smart scraper - extracts emails, phones, prices, dates, tables as structured JSON" },
    { method: "GET", path: "/api/scrape?url=https://example.com", price: "$0.02", description: "Web scraper - text, links, and metadata from any URL" },
    { method: "POST", path: "/api/summarize", price: "$0.01", description: "Extractive text summarization with keyword extraction" },
    { method: "GET", path: "/api/data/crypto?coin=bitcoin", price: "$0.005", description: "Real-time crypto price, volume, market cap, 24h change" },
    { method: "GET", path: "/api/data/weather?city=Dubai", price: "$0.005", description: "Current weather conditions for any city worldwide" },
    { method: "GET", path: "/api/gold-price?currency=AED", price: "$0.005", description: "Gold prices per gram (24K/22K/21K/18K) in 10 currencies" },
    { method: "GET", path: "/api/prayer-times?city=Dubai", price: "$0.005", description: "Islamic prayer times for any city with Hijri date" },
    { method: "GET", path: "/api/screenshot?url=https://example.com", price: "$0.02", description: "Website screenshot - full page capture as PNG" },
  ];

  const renderTable = (apis: typeof nlpApis) => (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
          <th style={{ padding: "6px 8px" }}>Endpoint</th>
          <th style={{ padding: "6px 8px" }}>Price</th>
          <th style={{ padding: "6px 8px" }}>Description</th>
        </tr>
      </thead>
      <tbody>
        {apis.map((ep) => (
          <tr key={ep.path} style={{ borderBottom: "1px solid #ddd" }}>
            <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: "0.8rem" }}>
              <strong>{ep.method}</strong> {ep.path}
            </td>
            <td style={{ padding: "6px 8px", fontWeight: "bold", whiteSpace: "nowrap" }}>{ep.price}</td>
            <td style={{ padding: "6px 8px", fontSize: "0.9rem" }}>{ep.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <h1>DeriveAI APIs</h1>
      <p>25 pay-per-request APIs for AI agents. Entity due diligence, Gulf Arabic NLP, business tools, data extraction, and more. No API keys, no accounts — just x402 + USDC on Base.</p>

      <h2 style={{ color: "#2d6a4f" }}>Premium — Entity Due Diligence</h2>
      {renderTable(premiumApis)}

      <h2>NLP & Content Analysis</h2>
      {renderTable(nlpApis)}

      <h2>Business & Verification</h2>
      {renderTable(businessApis)}

      <h2>Data & Utilities</h2>
      {renderTable(dataApis)}

      <h2>Integration</h2>
      <ul style={{ lineHeight: "1.8" }}>
        <li><strong>MCP Server:</strong> <code>https://x402-apis-eta.vercel.app/api/mcp</code></li>
        <li><strong>OpenAPI Spec:</strong> <code>https://x402-apis-eta.vercel.app/openapi.json</code></li>
        <li><strong>Agent Card:</strong> <code>https://x402-apis-eta.vercel.app/.well-known/agent.json</code></li>
      </ul>

      <p style={{ marginTop: "2rem", color: "#666" }}>
        Powered by the <a href="https://x402.org">x402 protocol</a>. Settlement in USDC on Base.
      </p>
    </div>
  );
}
