import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { BRAND } from "@/lib/brand";
import { appUrl } from "@/lib/env";

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
  themeColor: "#08090d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen mesh-gradient-bg text-zinc-100 antialiased font-sans">
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          toastOptions={{
            style: {
              background: "rgba(24, 24, 27, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              backdropFilter: "blur(16px)",
              borderRadius: "18px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            },
          }}
        />
      </body>
    </html>
  );
}
