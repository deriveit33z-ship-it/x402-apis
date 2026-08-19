import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Legal Jargon Simplifier - $0.01 per request
 *
 * Takes legal text (contract clauses, terms of service, privacy policies)
 * and returns plain English explanation, key obligations, and red flags.
 *
 * No pay-per-call API exists for this. Every agent processing contracts needs it.
 */

// Common legal terms → plain English
const LEGAL_TERMS: Record<string, string> = {
  "indemnify": "protect from financial loss / pay for damages",
  "indemnification": "agreement to cover someone's losses",
  "liability": "legal responsibility for something",
  "hereinafter": "from this point on referred to as",
  "whereas": "considering that / because",
  "notwithstanding": "despite / regardless of",
  "pursuant to": "according to / in accordance with",
  "in lieu of": "instead of",
  "hereunder": "under this agreement",
  "thereof": "of that",
  "therein": "in that",
  "hereby": "by this document / by doing this",
  "forthwith": "immediately",
  "shall": "must / is required to",
  "covenant": "a binding promise",
  "waiver": "giving up a right voluntarily",
  "arbitration": "settling a dispute outside court with a neutral third party",
  "jurisdiction": "the area or court that has legal authority",
  "severability": "if one part is invalid, the rest still applies",
  "force majeure": "unforeseeable events (war, natural disaster) that excuse non-performance",
  "non-compete": "agreement not to work for competitors",
  "non-disclosure": "agreement not to share confidential information",
  "intellectual property": "creations of the mind (inventions, designs, brands, code)",
  "governing law": "which country/state's laws apply to this contract",
  "breach": "violation of the agreement",
  "termination": "ending the agreement",
  "confidential information": "private data that cannot be shared",
  "good faith": "honest and fair dealing",
  "reasonable efforts": "trying genuinely but not required to succeed at all costs",
  "best efforts": "strongest obligation — must do everything possible",
  "material breach": "a serious violation that defeats the purpose of the contract",
  "liquidated damages": "pre-agreed penalty amount if contract is broken",
  "assignment": "transferring your rights/obligations to someone else",
  "representations and warranties": "promises that certain facts are true",
  "limitation of liability": "cap on how much one party can owe the other",
  "entire agreement": "this document is the complete deal — no side agreements count",
};

// Red flag patterns
const RED_FLAGS = [
  { pattern: /unlimited liability/i, flag: "No cap on what you could owe" },
  { pattern: /waive.*right.*sue/i, flag: "You may be giving up your right to take legal action" },
  { pattern: /auto[\s-]?renew/i, flag: "Contract automatically renews — check the cancellation window" },
  { pattern: /non[\s-]?compete/i, flag: "Restricts where you can work after this agreement ends" },
  { pattern: /sole discretion/i, flag: "One party can make decisions without the other's input" },
  { pattern: /binding arbitration/i, flag: "Disputes go to arbitration — you cannot sue in court" },
  { pattern: /irrevocable/i, flag: "Cannot be undone once agreed to" },
  { pattern: /perpetual license/i, flag: "Grants rights forever — even after the contract ends" },
  { pattern: /no refund/i, flag: "No money back under any circumstances" },
  { pattern: /indemnif/i, flag: "You may be responsible for covering the other party's losses" },
  { pattern: /automatic termination/i, flag: "Contract can end without notice under certain conditions" },
  { pattern: /liquidated damages/i, flag: "Pre-set penalty amount — check if it's reasonable" },
  { pattern: /best efforts/i, flag: "Strongest obligation — must do everything possible, not just try" },
  { pattern: /assigns? all.*rights/i, flag: "You may be transferring ownership of your work/IP" },
];

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const body = await req.json().catch(() => null);

  if (!body?.text) {
    return NextResponse.json({ error: "Missing 'text' field in request body" }, { status: 400 });
  }

  const { text } = body;

  if (text.length > 20000) {
    return NextResponse.json({ error: "Text exceeds 20,000 character limit" }, { status: 400 });
  }

  // Find legal terms used
  const termsFound: Array<{ term: string; meaning: string }> = [];
  const textLower = text.toLowerCase();
  for (const [term, meaning] of Object.entries(LEGAL_TERMS)) {
    if (textLower.includes(term)) {
      termsFound.push({ term, meaning });
    }
  }

  // Detect red flags
  const redFlags: string[] = [];
  for (const { pattern, flag } of RED_FLAGS) {
    if (pattern.test(text)) {
      redFlags.push(flag);
    }
  }

  // Calculate complexity score
  const avgWordLength = text.split(/\s+/).reduce((sum: number, w: string) => sum + w.length, 0) / Math.max(text.split(/\s+/).length, 1);
  const legalTermDensity = termsFound.length / Math.max(text.split(/\s+/).length / 100, 1);
  const complexity = Math.min(Math.round((avgWordLength * 0.3 + legalTermDensity * 0.4 + redFlags.length * 0.15) * 20) / 10, 10);

  // Extract key sentences (ones with obligations)
  const obligationWords = /\bshall\b|\bmust\b|\brequired\b|\bobligat/gi;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const obligations = sentences
    .filter((s: string) => obligationWords.test(s))
    .map((s: string) => s.trim().slice(0, 300))
    .slice(0, 10);

  // Determine risk level
  let riskLevel: string;
  if (redFlags.length === 0) riskLevel = "low";
  else if (redFlags.length <= 2) riskLevel = "moderate";
  else riskLevel = "high";

  return NextResponse.json({
    complexity_score: complexity,
    risk_level: riskLevel,
    legal_terms_found: termsFound.length,
    terms_explained: termsFound,
    red_flags: redFlags,
    key_obligations: obligations,
    word_count: text.split(/\s+/).length,
    analyzed_at: new Date().toISOString(),
  });
};

export const POST = withX402(
  handler,
  {
    accepts: { scheme: "exact", price: "$0.01", network, payTo },
    description: "Legal jargon simplifier - explains contract clauses in plain English, detects red flags, extracts obligations, and rates complexity",
  },
  resourceServer
);
