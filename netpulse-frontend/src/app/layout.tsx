import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetPulse — Global Internet Latency Monitor",
  description:
    "Real-time visibility into how the internet performs across the globe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
