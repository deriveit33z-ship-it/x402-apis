import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "x402 APIs - Pay-Per-Request Data Services",
  description: "AI-agent-friendly APIs with instant micropayments via x402 protocol. No API keys, no accounts - just pay and access.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem", maxWidth: "800px", marginInline: "auto" }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
