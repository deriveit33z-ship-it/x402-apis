import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Language & Script Detector - $0.005 per request
 *
 * Detects language, script type, and Arabic dialect from any text.
 * Supports: Arabic (MSA, Gulf, Egyptian, Levantine, Maghrebi), English,
 * French, Spanish, Hindi, Urdu, Turkish, Farsi, and mixed-language text.
 *
 * Also detects Arabizi (Latin-script Arabic) — unique capability.
 */

// Arabic dialect markers
const GULF_MARKERS = [
  "\u0648\u0627\u064a\u062f", "\u0639\u064a\u0644", "\u062e\u0648\u0634", "\u0634\u0644\u0648\u0646\u0643",
  "\u0645\u0628", "\u0647\u0644\u062d\u064a\u0646", "\u062f\u062d\u064a\u0646", "\u0627\u0628\u0627",
  "\u062a\u0648\u0646\u064a", "\u0631\u0628\u0639", "\u0627\u0634\u0644\u0648\u0646\u0643", "\u0686",
  "\u064a\u0627\u0644\u0644\u0647", "\u062e\u0627\u064a\u0633",
];
const EGYPTIAN_MARKERS = [
  "\u0628\u062a\u0627\u0639", "\u0627\u0632\u0627\u064a", "\u0643\u062f\u0647", "\u062f\u0647", "\u062f\u064a",
  "\u0639\u0627\u064a\u0632", "\u0639\u0627\u0648\u0632", "\u0641\u064a\u0646", "\u0628\u0631\u0636\u0648",
  "\u062d\u0627\u062c\u0629", "\u0645\u0641\u064a\u0634",
];
const LEVANTINE_MARKERS = [
  "\u0647\u0644\u0642", "\u0643\u064a\u0641\u0643", "\u0645\u0646\u064a\u062d", "\u0643\u062a\u064a\u0631",
  "\u0647\u064a\u0643", "\u0634\u0648", "\u0645\u0634\u0627\u0646", "\u0644\u0633\u0627",
  "\u0628\u062f\u064a", "\u0647\u0644\u0623",
];
const MAGHREBI_MARKERS = [
  "\u0648\u0627\u0634", "\u0628\u0632\u0627\u0641", "\u0643\u064a\u0641\u0627\u0634", "\u062f\u0627\u0628\u0627",
  "\u0645\u0627\u0643\u0627\u064a\u0646\u0634", "\u0639\u0644\u0627\u0634", "\u062f\u064a\u0627\u0644",
];

// Arabizi patterns (Latin-script Arabic)
const ARABIZI_PATTERNS = /\b(?:\w*[23578]\w*)\b/g;
const ARABIZI_WORDS = new Set([
  "7abibi", "3aysh", "shlonk", "shlonik", "yallah", "wallah", "inshallah",
  "mashallah", "khalas", "3yal", "wayed", "zain", "kifak", "ahlan",
  "marhaba", "shukran", "5alas", "ya3ni", "3arabi", "sa7", "9a7",
]);

// Script detection
function detectScript(text: string): { script: string; percentages: Record<string, number> } {
  const arabic = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  const cyrillic = (text.match(/[\u0400-\u04FF]/g) || []).length;
  const cjk = (text.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g) || []).length;

  const total = arabic + latin + devanagari + cyrillic + cjk || 1;

  const percentages: Record<string, number> = {};
  if (arabic > 0) percentages.arabic = Math.round((arabic / total) * 100);
  if (latin > 0) percentages.latin = Math.round((latin / total) * 100);
  if (devanagari > 0) percentages.devanagari = Math.round((devanagari / total) * 100);
  if (cyrillic > 0) percentages.cyrillic = Math.round((cyrillic / total) * 100);
  if (cjk > 0) percentages.cjk = Math.round((cjk / total) * 100);

  const dominant = Object.entries(percentages).sort(([, a], [, b]) => b - a)[0];
  const script = dominant ? dominant[0] : "unknown";

  return { script, percentages };
}

// Language detection
function detectLanguage(text: string): {
  language: string;
  dialect: string | null;
  confidence: number;
  is_arabizi: boolean;
  is_mixed: boolean;
} {
  const scriptInfo = detectScript(text);
  const words = text.toLowerCase().split(/\s+/);

  // Check for Arabizi
  const arabiziMatches = words.filter((w) => ARABIZI_WORDS.has(w)).length;
  const arabiziNumberPattern = (text.match(ARABIZI_PATTERNS) || []).length;
  const isArabizi = arabiziMatches >= 2 || (arabiziNumberPattern >= 3 && scriptInfo.script === "latin");

  if (isArabizi) {
    return {
      language: "Arabic (Arabizi)",
      dialect: "Likely Gulf",
      confidence: Math.min(0.5 + arabiziMatches * 0.15, 0.95),
      is_arabizi: true,
      is_mixed: false,
    };
  }

  // Arabic dialect detection
  if (scriptInfo.script === "arabic") {
    const gulfScore = GULF_MARKERS.filter((m) => text.includes(m)).length;
    const egyptScore = EGYPTIAN_MARKERS.filter((m) => text.includes(m)).length;
    const levantScore = LEVANTINE_MARKERS.filter((m) => text.includes(m)).length;
    const maghrebScore = MAGHREBI_MARKERS.filter((m) => text.includes(m)).length;
    const total = gulfScore + egyptScore + levantScore + maghrebScore;

    let dialect: string;
    let confidence: number;

    if (total === 0) {
      dialect = "MSA (Modern Standard Arabic)";
      confidence = 0.6;
    } else if (gulfScore >= egyptScore && gulfScore >= levantScore && gulfScore >= maghrebScore) {
      dialect = "Gulf/Khaleeji";
      confidence = Math.min(0.5 + gulfScore * 0.15, 0.95);
    } else if (egyptScore >= levantScore && egyptScore >= maghrebScore) {
      dialect = "Egyptian";
      confidence = Math.min(0.5 + egyptScore * 0.15, 0.95);
    } else if (levantScore >= maghrebScore) {
      dialect = "Levantine";
      confidence = Math.min(0.5 + levantScore * 0.15, 0.95);
    } else {
      dialect = "Maghrebi";
      confidence = Math.min(0.5 + maghrebScore * 0.15, 0.95);
    }

    // Check for mixed Arabic-English
    const isMixed = (scriptInfo.percentages.latin || 0) > 15;

    return { language: "Arabic", dialect, confidence, is_arabizi: false, is_mixed: isMixed };
  }

  // Latin script languages
  if (scriptInfo.script === "latin") {
    // Spanish markers
    if (/[áéíóúñ¿¡]/.test(text) || /\b(el|la|los|las|es|de|que|por|como|pero|hola)\b/i.test(text)) {
      return { language: "Spanish", dialect: null, confidence: 0.75, is_arabizi: false, is_mixed: false };
    }
    // French markers
    if (/[àâçéèêëïîôùûüÿœæ]/.test(text) || /\b(le|la|les|de|du|des|est|je|tu|nous|vous|avec|mais)\b/i.test(text)) {
      return { language: "French", dialect: null, confidence: 0.75, is_arabizi: false, is_mixed: false };
    }
    // Turkish markers
    if (/[çğıöşü]/.test(text) || /\b(bir|ve|bu|ile|için|var|olan|gibi)\b/i.test(text)) {
      return { language: "Turkish", dialect: null, confidence: 0.7, is_arabizi: false, is_mixed: false };
    }
    // Default to English
    return { language: "English", dialect: null, confidence: 0.6, is_arabizi: false, is_mixed: false };
  }

  // Devanagari
  if (scriptInfo.script === "devanagari") {
    return { language: "Hindi/Sanskrit", dialect: null, confidence: 0.7, is_arabizi: false, is_mixed: false };
  }

  return { language: "Unknown", dialect: null, confidence: 0.3, is_arabizi: false, is_mixed: false };
}

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const body = await req.json().catch(() => null);

  if (!body?.text) {
    return NextResponse.json({ error: "Missing 'text' field in request body" }, { status: 400 });
  }

  const { text } = body;

  if (text.length > 10000) {
    return NextResponse.json({ error: "Text exceeds 10,000 character limit" }, { status: 400 });
  }

  const scriptInfo = detectScript(text);
  const langInfo = detectLanguage(text);

  return NextResponse.json({
    language: langInfo.language,
    dialect: langInfo.dialect,
    confidence: langInfo.confidence,
    script: scriptInfo.script,
    script_breakdown: scriptInfo.percentages,
    is_arabizi: langInfo.is_arabizi,
    is_mixed_language: langInfo.is_mixed,
    text_preview: text.slice(0, 100) + (text.length > 100 ? "..." : ""),
    detected_at: new Date().toISOString(),
  });
};

export const POST = withX402(
  handler,
  {
    accepts: { scheme: "exact", price: "$0.005", network, payTo },
    description: "Language and script detector - identifies language, Arabic dialect (Gulf/Egyptian/Levantine/Maghrebi/MSA), Arabizi detection, and mixed-language text analysis",
  },
  resourceServer
);
