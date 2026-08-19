import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions";
import { resourceServer, payTo, network } from "@/lib/x402-server";
import { promises as dns } from "dns";

/**
 * Email Verification API - $0.01 per request
 *
 * Validates email addresses: format check, domain exists, MX records,
 * disposable email detection, role-based detection, free provider detection.
 *
 * Proven model — Interzoid charges $0.02 for this and is the top x402 seller.
 * We undercut at $0.01 with more features.
 */

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "trashmail.com", "yopmail.com", "sharklasers.com",
  "guerrillamailblock.com", "grr.la", "dispostable.com", "maildrop.cc",
  "temp-mail.org", "fakeinbox.com", "tempinbox.com", "burnermail.io",
  "mohmal.com", "getnada.com", "emailondeck.com", "tempail.com",
  "mailnesia.com", "tempr.email", "discard.email", "discardmail.com",
]);

const FREE_PROVIDERS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com",
  "aol.com", "icloud.com", "mail.com", "protonmail.com", "proton.me",
  "zoho.com", "yandex.com", "gmx.com", "fastmail.com", "tutanota.com",
  "inbox.com", "mail.ru", "qq.com", "163.com", "126.com",
]);

const ROLE_PREFIXES = new Set([
  "info", "admin", "support", "sales", "contact", "help", "office",
  "billing", "accounts", "hr", "jobs", "careers", "press", "media",
  "marketing", "abuse", "postmaster", "webmaster", "noreply", "no-reply",
]);

function validateFormat(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

async function checkMx(domain: string): Promise<{ hasMx: boolean; records: string[] }> {
  try {
    const records = await dns.resolveMx(domain);
    const sorted = records.sort((a, b) => a.priority - b.priority);
    return {
      hasMx: sorted.length > 0,
      records: sorted.slice(0, 5).map((r) => r.exchange),
    };
  } catch {
    return { hasMx: false, records: [] };
  }
}

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing 'email' query parameter" }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  // Format check
  if (!validateFormat(normalized)) {
    return NextResponse.json({
      email: normalized,
      valid: false,
      reason: "Invalid email format",
      checks: { format: false },
      verified_at: new Date().toISOString(),
    });
  }

  const [localPart, domain] = normalized.split("@");

  // MX record check
  const mx = await checkMx(domain);

  // Disposable check
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);

  // Free provider check
  const isFreeProvider = FREE_PROVIDERS.has(domain);

  // Role-based check
  const isRoleBased = ROLE_PREFIXES.has(localPart.split(/[.+]/)[0]);

  // Overall validity
  const valid = mx.hasMx && !isDisposable;

  return NextResponse.json({
    email: normalized,
    valid,
    deliverable: mx.hasMx ? "likely" : "no",
    checks: {
      format: true,
      domain_exists: mx.hasMx,
      has_mx_records: mx.hasMx,
      mx_records: mx.records,
      is_disposable: isDisposable,
      is_free_provider: isFreeProvider,
      is_role_based: isRoleBased,
    },
    risk: isDisposable ? "high" : isRoleBased ? "medium" : isFreeProvider ? "low" : "very_low",
    verified_at: new Date().toISOString(),
  });
};

export const GET = withX402(
  handler,
  {
    accepts: { scheme: "exact", price: "$0.01", network, payTo },
    description: "Email verification - validates format, domain, MX records, disposable/free/role-based detection with risk scoring",
  },
  resourceServer
);
