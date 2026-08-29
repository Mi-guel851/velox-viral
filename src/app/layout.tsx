import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { BRAND } from "@/lib/brand";
import { appUrl } from "@/lib/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — Write once. Publish everywhere.`,
    description: BRAND.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — Write once. Publish everywhere.`,
    description: BRAND.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d13",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen text-zinc-100 antialiased font-sans grain-overlay">
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          toastOptions={{
            style: {
              background: "rgba(16, 18, 28, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              backdropFilter: "blur(20px)",
              borderRadius: "14px",
              boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5)",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
