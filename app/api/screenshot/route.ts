import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { resourceServer, payTo, network } from "@/lib/x402-server";

/**
 * Website Screenshot API - $0.02 per request
 *
 * Captures a screenshot of any URL and returns it as a PNG image.
 * Uses Google's PageSpeed Insights API (free, no key needed) to get
 * a rendered screenshot of the page.
 *
 * Agents use this for: visual verification, thumbnail generation,
 * content preview, competitor monitoring, and documentation.
 */

const handler = async (req: NextRequest): Promise<NextResponse<unknown>> => {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const format = searchParams.get("format") || "json"; // json or image

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  try {
    // Use Google PageSpeed Insights to get a screenshot
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=desktop`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to capture screenshot: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Extract the screenshot from the audit
    const screenshot =
      data.lighthouseResult?.audits?.["final-screenshot"]?.details?.data ||
      data.lighthouseResult?.audits?.["full-page-screenshot"]?.details?.screenshot?.data;

    if (!screenshot) {
      return NextResponse.json(
        { error: "Could not capture screenshot for this URL" },
        { status: 502 }
      );
    }

    // If format=image, return the raw image
    if (format === "image") {
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": imageBuffer.length.toString(),
        },
      }) as NextResponse<unknown>;
    }

    // Default: return JSON with metadata + base64 image
    const performanceScore = data.lighthouseResult?.categories?.performance?.score;
    const metrics = data.lighthouseResult?.audits?.metrics?.details?.items?.[0] || {};

    return NextResponse.json({
      url,
      screenshot: screenshot,
      performance_score: performanceScore ? Math.round(performanceScore * 100) : null,
      metrics: {
        first_contentful_paint_ms: metrics.firstContentfulPaint || null,
        largest_contentful_paint_ms: metrics.largestContentfulPaint || null,
        total_blocking_time_ms: metrics.totalBlockingTime || null,
        speed_index_ms: metrics.speedIndex || null,
      },
      captured_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const GET = withX402(
  handler,
  {
    accepts: { scheme: "exact", price: "$0.02", network, payTo },
    description: "Website screenshot - captures full page as image with performance metrics (Lighthouse score, FCP, LCP, TBT)",
  },
  resourceServer
);
