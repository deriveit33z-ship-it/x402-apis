import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions";
import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Text Summarization API - $0.01 per request
 * Extracts key points from text content using extractive summarization.
 * No external AI API needed - runs locally using sentence scoring.
 */
const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const body = await req.json().catch(() => null);

  if (!body?.text) {
    return NextResponse.json(
      { error: "Missing 'text' field in request body" },
      { status: 400 }
    );
  }

  const { text, max_sentences = 5 } = body;

  if (text.length > 50000) {
    return NextResponse.json(
      { error: "Text exceeds 50,000 character limit" },
      { status: 400 }
    );
  }

  // Extractive summarization: score sentences by keyword frequency
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s: string) => s.length > 20);

  if (sentences.length === 0) {
    return NextResponse.json(
      { error: "No sentences found in text" },
      { status: 400 }
    );
  }

  // Build word frequency map (excluding stop words)
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "each",
    "every", "both", "few", "more", "most", "other", "some", "such", "no",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "because", "but", "and", "or", "if", "while", "this", "that", "it",
  ]);

  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const word of words) {
    if (!stopWords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  // Score each sentence
  const scored = sentences.map((sentence: string) => {
    const sentenceWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const score = sentenceWords.reduce(
      (sum: number, w: string) => sum + (freq[w] || 0),
      0
    ) / Math.max(sentenceWords.length, 1);
    return { sentence, score };
  });

  // Take top N sentences in original order
  const topIndices = scored
    .map((s: { sentence: string; score: number }, i: number) => ({ ...s, index: i }))
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, max_sentences)
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index);

  const summary = topIndices.map((s: { sentence: string }) => s.sentence).join(" ");

  // Extract keywords (top 10 by frequency)
  const keywords = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return NextResponse.json({
    summary,
    keywords,
    original_length: text.length,
    summary_length: summary.length,
    compression_ratio: Math.round((1 - summary.length / text.length) * 100) + "%",
    summarized_at: new Date().toISOString(),
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
    description: "Text summarization - extracts key sentences and keywords from text",
  },
  resourceServer
);
