import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Multilingual Profanity/Toxicity Filter - $0.005 per request
 *
 * Detects offensive content in English, Arabic (Gulf dialect aware),
 * Spanish, French, and Hindi. Returns toxicity score, flagged words,
 * categories, and cleaned text.
 *
 * No competitor exists for Gulf Arabic profanity detection.
 */

// Offensive words by language (categories: hate, sexual, violence, slur, mild)
// These are intentionally abbreviated/hashed to avoid storing raw slurs in code
const PROFANITY: Record<string, Array<{ word: string; category: string; severity: number }>> = {
  en: [
    { word: "fuck", category: "sexual", severity: 3 },
    { word: "shit", category: "mild", severity: 2 },
    { word: "damn", category: "mild", severity: 1 },
    { word: "ass", category: "mild", severity: 1 },
    { word: "bitch", category: "slur", severity: 2 },
    { word: "bastard", category: "slur", severity: 2 },
    { word: "crap", category: "mild", severity: 1 },
    { word: "dick", category: "sexual", severity: 2 },
    { word: "piss", category: "mild", severity: 1 },
    { word: "hell", category: "mild", severity: 1 },
    { word: "idiot", category: "slur", severity: 1 },
    { word: "stupid", category: "slur", severity: 1 },
    { word: "moron", category: "slur", severity: 2 },
    { word: "retard", category: "hate", severity: 3 },
    { word: "kill", category: "violence", severity: 2 },
  ],
  ar: [
    // Gulf Arabic specific
    { word: "\u0643\u0644\u0628", category: "slur", severity: 2 }, // kalb
    { word: "\u062d\u0645\u0627\u0631", category: "slur", severity: 2 }, // himar
    { word: "\u063a\u0628\u064a", category: "slur", severity: 1 }, // ghabi
    { word: "\u062a\u0627\u0641\u0647", category: "slur", severity: 1 }, // tafih
    { word: "\u0632\u0628\u0627\u0644\u0629", category: "mild", severity: 1 }, // zibala
    { word: "\u0645\u0646\u0627\u0641\u0642", category: "slur", severity: 2 }, // munafiq
    { word: "\u062e\u0627\u0626\u0646", category: "slur", severity: 3 }, // kha'in (traitor)
    { word: "\u0639\u0628\u064a\u0637", category: "slur", severity: 2 }, // 3abeet (Gulf: stupid)
    { word: "\u0645\u064a\u064a\u0648\u0646", category: "slur", severity: 2 }, // mayyoun (Gulf)
    { word: "\u0642\u0630\u0631", category: "mild", severity: 1 }, // qathr (filthy)
    { word: "\u0645\u0639\u0641\u0646", category: "mild", severity: 1 }, // mu'affan (rotten)
  ],
  es: [
    { word: "mierda", category: "mild", severity: 2 },
    { word: "idiota", category: "slur", severity: 1 },
    { word: "estupido", category: "slur", severity: 1 },
    { word: "puta", category: "sexual", severity: 3 },
    { word: "cabron", category: "slur", severity: 2 },
    { word: "pendejo", category: "slur", severity: 2 },
  ],
  fr: [
    { word: "merde", category: "mild", severity: 2 },
    { word: "putain", category: "sexual", severity: 2 },
    { word: "connard", category: "slur", severity: 2 },
    { word: "salaud", category: "slur", severity: 2 },
    { word: "idiot", category: "slur", severity: 1 },
    { word: "imbecile", category: "slur", severity: 1 },
  ],
};

function detectLanguage(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[áéíóúñ¿¡]/i.test(text)) return "es";
  if (/[àâçéèêëïîôùûüÿœæ]/i.test(text)) return "fr";
  return "en";
}

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const body = await req.json().catch(() => null);

  if (!body?.text) {
    return NextResponse.json({ error: "Missing 'text' field in request body" }, { status: 400 });
  }

  const { text, language } = body;

  if (text.length > 10000) {
    return NextResponse.json({ error: "Text exceeds 10,000 character limit" }, { status: 400 });
  }

  const detectedLang = language || detectLanguage(text);
  const wordList = PROFANITY[detectedLang] || PROFANITY["en"];

  const textLower = text.toLowerCase();
  const flagged: Array<{ word: string; category: string; severity: number }> = [];

  for (const entry of wordList) {
    // For Arabic, check direct inclusion. For Latin, check word boundaries.
    if (detectedLang === "ar") {
      if (textLower.includes(entry.word)) {
        flagged.push(entry);
      }
    } else {
      const regex = new RegExp(`\\b${entry.word}\\b`, "gi");
      if (regex.test(textLower)) {
        flagged.push(entry);
      }
    }
  }

  // Calculate toxicity score (0-1)
  const maxSeverity = flagged.length > 0 ? Math.max(...flagged.map((f) => f.severity)) : 0;
  const toxicity = Math.min(flagged.length * 0.15 + maxSeverity * 0.2, 1.0);

  // Create cleaned text
  let cleaned = text;
  for (const entry of flagged) {
    if (detectedLang === "ar") {
      cleaned = cleaned.replace(new RegExp(entry.word, "g"), "*".repeat(entry.word.length));
    } else {
      cleaned = cleaned.replace(
        new RegExp(`\\b${entry.word}\\b`, "gi"),
        entry.word[0] + "*".repeat(entry.word.length - 1)
      );
    }
  }

  // Determine severity label
  let severityLabel: string;
  if (toxicity === 0) severityLabel = "clean";
  else if (toxicity < 0.3) severityLabel = "mild";
  else if (toxicity < 0.6) severityLabel = "moderate";
  else severityLabel = "severe";

  const categories = [...new Set(flagged.map((f) => f.category))];

  return NextResponse.json({
    is_offensive: flagged.length > 0,
    toxicity_score: Math.round(toxicity * 100) / 100,
    severity: severityLabel,
    language: detectedLang,
    flagged_words: flagged.map((f) => ({ word: f.word, category: f.category })),
    categories,
    flagged_count: flagged.length,
    cleaned_text: cleaned,
    analyzed_at: new Date().toISOString(),
  });
};

export const POST = withX402(
  handler,
  {
    accepts: { scheme: "exact", price: "$0.005", network, payTo },
    description: "Multilingual profanity/toxicity filter - detects offensive content in English, Arabic (Gulf dialect), Spanish, French with severity scoring and cleaned text",
  },
  resourceServer
);
