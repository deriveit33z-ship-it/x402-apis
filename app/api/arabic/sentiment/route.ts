import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions";
import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Gulf Arabic Sentiment Analysis API - $0.01 per request
 *
 * Analyzes sentiment in Arabic text with special handling for Gulf/Khaleeji dialect.
 * Global LLMs hit ~45% accuracy on Gulf dialect — this API is purpose-built for it.
 *
 * Supports: Modern Standard Arabic (MSA), Gulf/Khaleeji, Egyptian, Levantine
 * Returns: sentiment (positive/negative/neutral), confidence, detected dialect, keywords
 */

// Gulf Arabic sentiment lexicon — words with polarity scores
// This covers Khaleeji dialect terms that global models miss
const GULF_POSITIVE: Record<string, number> = {
  // Khaleeji positive
  "\u0632\u064a\u0646": 2, // zain (good)
  "\u062d\u0644\u0648": 2, // helw (nice/sweet)
  "\u0623\u062d\u0644\u0649": 2, // ahla (nicer)
  "\u064a\u0627\u0644\u0644\u0647": 1, // yallah (positive exclamation)
  "\u0645\u0634\u0643\u0648\u0631": 2, // mashkour (thank you)
  "\u062a\u0633\u0644\u0645": 2, // tislam (bless you)
  "\u064a\u0639\u0637\u064a\u0643 \u0627\u0644\u0639\u0627\u0641\u064a\u0629": 2, // may God give you health
  "\u0645\u0627\u0634\u0627\u0621\u0627\u0644\u0644\u0647": 2, // mashallah
  "\u0627\u0644\u062d\u0645\u062f\u0644\u0644\u0647": 1, // alhamdulillah
  "\u062a\u0628\u0627\u0631\u0643\u0627\u0644\u0644\u0647": 2, // tabarakallah
  "\u0631\u0647\u064a\u0628": 2, // raheeb (awesome)
  "\u062e\u0631\u0627\u0641\u064a": 2, // khurafi (fantastic)
  "\u0623\u0633\u0637\u0648\u0631\u064a": 2, // usturi (legendary)
  "\u062e\u0648\u0634": 2, // khosh (good - Iraqi/Gulf)
  "\u0648\u0627\u064a\u062f": 1, // wayed (very - Gulf intensifier)
  "\u0639\u064a\u0644": 1, // ayil (very - Gulf intensifier)
  // MSA positive
  "\u062c\u0645\u064a\u0644": 2, // jameel (beautiful)
  "\u0645\u0645\u062a\u0627\u0632": 2, // mumtaz (excellent)
  "\u0631\u0627\u0626\u0639": 2, // ra'e (wonderful)
  "\u0634\u0643\u0631\u0627": 1, // shukran (thank you)
  "\u0623\u062d\u0628": 2, // aheb (love)
  "\u0633\u0639\u064a\u062f": 2, // sa'eed (happy)
  "\u0641\u0631\u062d": 2, // farah (joy)
  "\u0646\u062c\u0627\u062d": 2, // najah (success)
  "\u062a\u0642\u062f\u0645": 1, // taqaddum (progress)
  "\u0625\u0646\u062c\u0627\u0632": 2, // injaz (achievement)
};

const GULF_NEGATIVE: Record<string, number> = {
  // Khaleeji negative
  "\u062e\u0627\u064a\u0633": -2, // khayis (bad - Gulf)
  "\u0645\u0628 \u0632\u064a\u0646": -2, // mub zain (not good - Gulf)
  "\u0645\u0627\u0644\u0647 \u062f\u0627\u0639\u064a": -1, // malah da'i (unnecessary - Gulf)
  "\u0645\u0627\u0641\u064a": -1, // mafi (none/nothing - Gulf)
  "\u062a\u0639\u0628\u0627\u0646": -2, // ta'ban (tired/sick)
  "\u0632\u0639\u0644\u0627\u0646": -2, // za'lan (angry/upset)
  "\u062d\u0631\u0627\u0645": -2, // haram (forbidden/shame)
  "\u0639\u064a\u0628": -2, // ayb (shame)
  "\u064a\u0627\u0644\u0637\u064a\u062d": -1, // yaltiyeh (expression of disappointment)
  // MSA negative
  "\u0633\u064a\u0626": -2, // sayye (bad)
  "\u0641\u0634\u0644": -2, // fashal (failure)
  "\u0645\u0634\u0643\u0644\u0629": -2, // mushkila (problem)
  "\u062e\u0637\u0623": -1, // khata (error)
  "\u062e\u0637\u064a\u0631": -2, // khateer (dangerous)
  "\u0642\u0628\u064a\u062d": -2, // qabeeh (ugly)
  "\u063a\u0636\u0628": -2, // ghadab (anger)
  "\u062d\u0632\u0646": -2, // huzn (sadness)
  "\u0643\u0631\u0647": -2, // karh (hatred)
  "\u062e\u0648\u0641": -2, // khawf (fear)
};

// Negation words that flip sentiment
const NEGATION_WORDS = new Set([
  "\u0645\u0627", "\u0644\u0627", "\u0645\u0634", "\u0645\u0648", "\u0645\u0628", // ma, la, mish, mo, mub
  "\u0645\u0648\u0628", "\u0645\u0648\u0645\u0628", "\u0644\u064a\u0633", "\u063a\u064a\u0631", // moub, momub, lays, ghayr
]);

// Gulf dialect markers for dialect detection
const GULF_MARKERS = [
  "\u0648\u0627\u064a\u062f", "\u0639\u064a\u0644", "\u0686", "\u062e\u0648\u0634", "\u0627\u0634\u0644\u0648\u0646\u0643",
  "\u0634\u0644\u0648\u0646\u0643", "\u0645\u0628", "\u0627\u0647\u0627", "\u0647\u0644\u062d\u064a\u0646",
  "\u062f\u062d\u064a\u0646", "\u0627\u0628\u0627", "\u062a\u0648\u0646\u064a", "\u0631\u0628\u0639",
];
const EGYPTIAN_MARKERS = [
  "\u0628\u062a\u0627\u0639", "\u0627\u0632\u0627\u064a", "\u0643\u062f\u0647", "\u062f\u0647", "\u062f\u064a",
  "\u0639\u0627\u064a\u0632", "\u0639\u0627\u0648\u0632", "\u0641\u064a\u0646", "\u0628\u0631\u0636\u0648",
];
const LEVANTINE_MARKERS = [
  "\u0647\u0644\u0642", "\u0643\u064a\u0641\u0643", "\u0645\u0646\u064a\u062d", "\u0643\u062a\u064a\u0631",
  "\u0647\u064a\u0643", "\u0634\u0648", "\u0645\u0634\u0627\u0646", "\u0644\u0633\u0627",
];

function detectDialect(text: string): { dialect: string; confidence: number } {
  const gulfScore = GULF_MARKERS.filter((m) => text.includes(m)).length;
  const egyptScore = EGYPTIAN_MARKERS.filter((m) => text.includes(m)).length;
  const levantScore = LEVANTINE_MARKERS.filter((m) => text.includes(m)).length;
  const total = gulfScore + egyptScore + levantScore;

  if (total === 0) return { dialect: "MSA", confidence: 0.6 };
  if (gulfScore >= egyptScore && gulfScore >= levantScore)
    return { dialect: "Gulf/Khaleeji", confidence: Math.min(0.5 + gulfScore * 0.15, 0.95) };
  if (egyptScore >= levantScore)
    return { dialect: "Egyptian", confidence: Math.min(0.5 + egyptScore * 0.15, 0.95) };
  return { dialect: "Levantine", confidence: Math.min(0.5 + levantScore * 0.15, 0.95) };
}

function analyzeSentiment(text: string): {
  sentiment: string;
  score: number;
  confidence: number;
  positive_words: string[];
  negative_words: string[];
} {
  const words = text.split(/\s+/);
  let score = 0;
  const positiveFound: string[] = [];
  const negativeFound: string[] = [];
  let negated = false;

  for (const word of words) {
    const clean = word.replace(/[^\u0600-\u06FF\u0750-\u077F]/g, "");
    if (!clean) continue;

    if (NEGATION_WORDS.has(clean)) {
      negated = true;
      continue;
    }

    if (GULF_POSITIVE[clean]) {
      const val = negated ? -GULF_POSITIVE[clean] : GULF_POSITIVE[clean];
      score += val;
      if (val > 0) positiveFound.push(clean);
      else negativeFound.push(clean);
      negated = false;
    } else if (GULF_NEGATIVE[clean]) {
      const val = negated ? -GULF_NEGATIVE[clean] : GULF_NEGATIVE[clean];
      score += val;
      if (val < 0) negativeFound.push(clean);
      else positiveFound.push(clean);
      negated = false;
    } else {
      negated = false;
    }
  }

  const magnitude = Math.abs(score);
  const confidence = Math.min(0.4 + magnitude * 0.1, 0.95);

  let sentiment: string;
  if (score > 0) sentiment = "positive";
  else if (score < 0) sentiment = "negative";
  else sentiment = "neutral";

  return {
    sentiment,
    score,
    confidence,
    positive_words: [...new Set(positiveFound)],
    negative_words: [...new Set(negativeFound)],
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

  if (text.length > 10000) {
    return NextResponse.json(
      { error: "Text exceeds 10,000 character limit" },
      { status: 400 }
    );
  }

  const dialect = detectDialect(text);
  const sentiment = analyzeSentiment(text);

  return NextResponse.json({
    text: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
    sentiment: sentiment.sentiment,
    score: sentiment.score,
    confidence: sentiment.confidence,
    dialect: dialect.dialect,
    dialect_confidence: dialect.confidence,
    positive_words: sentiment.positive_words,
    negative_words: sentiment.negative_words,
    analyzed_at: new Date().toISOString(),
  });
};

export const POST = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.01",
      network,
      payTo,
    },
    description:
      "Gulf Arabic sentiment analysis - dialect-aware sentiment detection for Khaleeji, Egyptian, Levantine, and MSA text",
  },
  resourceServer
);
