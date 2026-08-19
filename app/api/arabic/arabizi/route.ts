import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions";
import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Arabizi to Arabic Transliteration API - $0.005 per request
 *
 * Converts Arabizi (Arabic written in Latin characters) to Arabic script.
 * Arabizi is massively used in GCC social media, messaging, and informal content.
 * No pay-per-call API exists anywhere for this — this is a genuine market gap.
 *
 * Examples: "3aysh" → "عايش", "7abibi" → "حبيبي", "msa2" → "مساء"
 */

// Arabizi to Arabic character mapping
// Numbers represent Arabic letters by visual similarity
const ARABIZI_MAP: Record<string, string> = {
  // Number mappings (the core of Arabizi)
  "2": "\u0621",   // hamza ء
  "3": "\u0639",   // ain ع
  "3'": "\u063A",  // ghain غ
  "5": "\u062E",   // kha خ
  "6": "\u0637",   // ta (emphatic) ط
  "6'": "\u0638",  // tha (emphatic) ظ
  "7": "\u062D",   // ha ح
  "7'": "\u062E",  // kha خ (alternate)
  "8": "\u0642",   // qaf ق (Gulf usage)
  "9": "\u0635",   // sad ص
  "9'": "\u0636",  // dad ض

  // Standard letter mappings
  "a": "\u0627",   // alif ا
  "aa": "\u0627",  // alif (long)
  "b": "\u0628",   // ba ب
  "t": "\u062A",   // ta ت
  "th": "\u062B",  // tha ث
  "j": "\u062C",   // jim ج
  "ch": "\u062A\u0634", // tsh تش
  "d": "\u062F",   // dal د
  "dh": "\u0630",  // dhal ذ
  "r": "\u0631",   // ra ر
  "z": "\u0632",   // zay ز
  "s": "\u0633",   // sin س
  "sh": "\u0634",  // shin ش
  "f": "\u0641",   // fa ف
  "g": "\u062C",   // jim (Egyptian) / ga ج
  "q": "\u0642",   // qaf ق
  "k": "\u0643",   // kaf ك
  "l": "\u0644",   // lam ل
  "m": "\u0645",   // mim م
  "n": "\u0646",   // nun ن
  "h": "\u0647",   // ha ه
  "w": "\u0648",   // waw و
  "oo": "\u0648",  // waw (long vowel)
  "ou": "\u0648",  // waw variant
  "y": "\u064A",   // ya ي
  "i": "\u064A",   // ya (as vowel)
  "ii": "\u064A",  // ya (long)
  "ee": "\u064A",  // ya (long variant)
  "u": "\u0648",   // waw (as vowel)
  "e": "\u064A",   // ya (short e)
  "o": "\u0648",   // waw (short o)
};

// Common Gulf Arabizi words with known correct transliterations
const WORD_OVERRIDES: Record<string, string> = {
  "allah": "\u0627\u0644\u0644\u0647",
  "inshallah": "\u0625\u0646 \u0634\u0627\u0621 \u0627\u0644\u0644\u0647",
  "mashallah": "\u0645\u0627 \u0634\u0627\u0621 \u0627\u0644\u0644\u0647",
  "alhamdulillah": "\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647",
  "wallah": "\u0648\u0627\u0644\u0644\u0647",
  "yallah": "\u064A\u0627\u0644\u0644\u0647",
  "3yal": "\u0639\u064A\u0627\u0644",
  "7abibi": "\u062D\u0628\u064A\u0628\u064A",
  "7abibti": "\u062D\u0628\u064A\u0628\u062A\u064A",
  "shukran": "\u0634\u0643\u0631\u0627\u064B",
  "marhaba": "\u0645\u0631\u062D\u0628\u0627",
  "ahlan": "\u0623\u0647\u0644\u0627\u064B",
  "salam": "\u0633\u0644\u0627\u0645",
  "salaam": "\u0633\u0644\u0627\u0645",
  "sabah": "\u0635\u0628\u0627\u062D",
  "masa2": "\u0645\u0633\u0627\u0621",
  "3aysh": "\u0639\u0627\u064A\u0634",
  "wayed": "\u0648\u0627\u064A\u062F",
  "khosh": "\u062E\u0648\u0634",
  "zain": "\u0632\u064A\u0646",
  "9a7": "\u0635\u062D",
  "yalla": "\u064A\u0627\u0644\u0644\u0627",
  "khalas": "\u062E\u0644\u0627\u0635",
  "5alas": "\u062E\u0644\u0627\u0635",
  "3ayal": "\u0639\u064A\u0627\u0644",
  "shlonk": "\u0634\u0644\u0648\u0646\u0643",
  "shlonik": "\u0634\u0644\u0648\u0646\u0643",
  "kifak": "\u0643\u064A\u0641\u0643",
  "enta": "\u0623\u0646\u062A",
  "ana": "\u0623\u0646\u0627",
  "inti": "\u0623\u0646\u062A\u064A",
  "howa": "\u0647\u0648",
  "hiya": "\u0647\u064A",
  "3arabi": "\u0639\u0631\u0628\u064A",
  "arabi": "\u0639\u0631\u0628\u064A",
  "emarat": "\u0625\u0645\u0627\u0631\u0627\u062A",
  "dubai": "\u062F\u0628\u064A",
  "abu dhabi": "\u0623\u0628\u0648 \u0638\u0628\u064A",
};

function transliterateWord(word: string): string {
  const lower = word.toLowerCase();

  // Check word overrides first
  if (WORD_OVERRIDES[lower]) return WORD_OVERRIDES[lower];

  // Character-by-character transliteration with multi-char lookahead
  let result = "";
  let i = 0;

  while (i < lower.length) {
    let matched = false;

    // Try 3-char, 2-char, then 1-char matches
    for (const len of [3, 2, 1]) {
      const substr = lower.slice(i, i + len);
      if (ARABIZI_MAP[substr]) {
        result += ARABIZI_MAP[substr];
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Keep non-mappable characters as-is (spaces, punctuation, etc.)
      result += lower[i];
      i++;
    }
  }

  return result;
}

function transliterate(text: string): { arabic: string; word_map: Record<string, string> } {
  const words = text.split(/(\s+)/);
  const wordMap: Record<string, string> = {};
  const arabicWords: string[] = [];

  for (const segment of words) {
    if (/^\s+$/.test(segment)) {
      arabicWords.push(" ");
      continue;
    }

    // Skip if already Arabic
    if (/[\u0600-\u06FF]/.test(segment)) {
      arabicWords.push(segment);
      continue;
    }

    const arabic = transliterateWord(segment);
    arabicWords.push(arabic);
    if (segment.toLowerCase() !== arabic) {
      wordMap[segment] = arabic;
    }
  }

  return {
    arabic: arabicWords.join(""),
    word_map: wordMap,
  };
}

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const body = await req.json().catch(() => null);

  if (!body?.text) {
    return NextResponse.json(
      { error: "Missing 'text' field in request body" },
      { status: 400 }
    );
  }

  const { text } = body;

  if (text.length > 5000) {
    return NextResponse.json(
      { error: "Text exceeds 5,000 character limit" },
      { status: 400 }
    );
  }

  const result = transliterate(text);

  return NextResponse.json({
    original: text,
    arabic: result.arabic,
    word_map: result.word_map,
    characters_converted: Object.keys(result.word_map).length,
    transliterated_at: new Date().toISOString(),
  });
};

export const POST = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.005",
      network,
      payTo,
    },
    description:
      "Arabizi to Arabic transliteration - converts Latin-script Arabic (chat language) to Arabic script. Gulf dialect optimized.",
  },
  resourceServer
);
