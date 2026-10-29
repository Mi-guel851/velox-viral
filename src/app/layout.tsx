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
  themeColor: "#f8fbff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen antialiased font-sans">
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #dce6f2",
              color: "#14243b",
              backdropFilter: "blur(20px)",
              borderRadius: "14px",
              boxShadow: "0 18px 45px -12px rgba(40,80,140,0.18)",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
