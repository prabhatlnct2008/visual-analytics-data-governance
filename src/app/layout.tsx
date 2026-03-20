import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trusted Analytics Copilot",
  description: "Governed analytics copilot for trusted retail insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
