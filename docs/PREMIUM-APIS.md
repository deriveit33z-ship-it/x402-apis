# Premium APIs — $0.50 Each

## What Makes These Premium

Each API runs 5-6 parallel network checks and cross-references the results into a single scored report. An agent would need 10-15 separate API calls to get the same data. At $0.50, it saves $1-3 in LLM compute costs.

---

## 1. Entity Due Diligence (/api/due-diligence)
**Input:** `?domain=example.com` or `?company=Example Inc`
**What it does:** Checks WHOIS registration, SSL certificates, sanctions databases, web archive history, and web presence. Returns a trust score (0-100) with evidence signals.
**Use case:** Agent verifying a counterparty before signing a contract or sending payment.
**Data sources:** RDAP, crt.sh, OpenSanctions, Wayback Machine, direct web fetch.

## 2. Website Security & SEO Audit (/api/site-audit)
**Input:** `?url=https://example.com`
**What it does:** Checks security headers (7 types), SSL certificate grade, DNS configuration (DNSSEC, SPF), SEO meta tags (title, OG, canonical, headings, images), and Lighthouse performance. Returns scored report per category.
**Use case:** Agent evaluating a website's quality, security posture, or SEO health.
**Data sources:** HTTP HEAD, crt.sh, Google DoH, page fetch + cheerio, Google PageSpeed API.

## 3. Email Infrastructure Audit (/api/email-audit)
**Input:** `?domain=example.com`
**What it does:** Checks SPF record and policy, DKIM selectors (10 tested), DMARC policy and reporting, MX server configuration, blacklist status (8 DNSBLs), and DNSSEC. Returns deliverability score (0-100).
**Use case:** Agent auditing email security for a client, checking if emails will land in spam.
**Data sources:** All DNS-based (zero external API keys needed). dns.resolve for MX/TXT/DMARC, DNSBL lookups, Google DoH.

## 4. IP Address Intelligence (/api/ip-intel)
**Input:** `?ip=8.8.8.8`
**What it does:** Geolocation (country, city, ISP, ASN), reverse DNS, blacklist checking (8 DNSBLs), VPN/proxy/hosting detection, abuse history (AbuseIPDB if configured), Tor exit node detection. Returns risk score (0-100).
**Use case:** Agent investigating suspicious IPs from logs, signups, or failed auth attempts.
**Data sources:** ip-api.com, dns.reverse, DNSBL queries, AbuseIPDB (optional), Google DoH.

## 5. Username OSINT Report (/api/username-osint)
**Input:** `?username=johndoe`
**What it does:** Checks 25+ platforms (GitHub, Reddit, Twitter, Instagram, npm, Steam, etc.) for the username. Categorizes by type (developer, social, creative, gaming). Enriches GitHub profile if found. Checks domain availability for the username.
**Use case:** Background checks, brand monitoring, identity verification, finding a person's online presence.
**Data sources:** HTTP HEAD/GET to 25+ platform URLs, GitHub API, DNS resolution for domains.

## 6. Domain Infrastructure Map (/api/domain-infra)
**Input:** `?domain=example.com`
**What it does:** Full DNS record dump (A, AAAA, MX, NS, TXT, SOA, CAA, CNAME), hosting provider detection, CDN identification (Cloudflare, Vercel, AWS, Fastly, Akamai), subdomain discovery via DNS brute-force (30 common subs) and Certificate Transparency (crt.sh), IP geolocation.
**Use case:** Competitive intelligence, security assessment, acquisition due diligence, infrastructure auditing.
**Data sources:** Node.js dns module, crt.sh API, HTTP headers analysis, ip-api.com.

## 7. Brand Availability Scout (/api/brand-scout)
**Input:** `?name=mybrandname`
**What it does:** Checks domain availability across 12 TLDs (.com, .io, .dev, etc.), social handle availability on 15+ platforms, USPTO trademark conflicts, and alternative name variations. Returns availability score (0-100) with go/no-go recommendation.
**Use case:** Agent helping someone start a business, launch a product, or choose a brand name.
**Data sources:** DNS resolution, RDAP/WHOIS, HTTP HEAD to social platforms, USPTO API.

---

## 8. Competitive Analysis (/api/competitor-analysis) — $1.00
**Input:** `?domain1=google.com&domain2=bing.com`
**What it does:** Profiles BOTH domains in parallel (10 network requests each, 20 total) and compares them head-to-head across 8 dimensions: security headers, SEO quality, Lighthouse performance, SSL health, email security (SPF/DMARC), social presence, infrastructure (CDN/IPv6), and domain maturity. Returns a winner per category and overall verdict.
**Use case:** Agent doing competitive research, evaluating vendors, comparing acquisition targets, or benchmarking a client's site against competitors.
**Data sources:** DNS (A, AAAA, NS, SPF, DMARC), crt.sh (SSL), HTTP headers (security + tech stack), page fetch + cheerio (SEO + social), Google PageSpeed (performance), RDAP (domain age).
**Why $1.00:** Does everything the $0.50 site-audit does but for TWO sites plus cross-referencing and comparison logic. 20+ network requests in parallel. An agent would need 20+ separate API calls and its own comparison algorithm.

---

## Revenue Math

| Scenario | Per Sweep | Monthly (weekly sweeps) |
|----------|-----------|------------------------|
| Old (2 premium APIs) | $1.00 | $4.00 |
| Current (7x $0.50 + 1x $1.00) | $4.50 | $18.00 |
| + 16 cheap APIs | $4.50 + ~$0.15 = $4.65 | $18.60 |

One agent doing a full sweep of all 24 endpoints = $4.65 per sweep.
