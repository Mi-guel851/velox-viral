import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ViralFlow • Premium AI Social Media Management & Flywheel",
  description:
    "Apple-inspired AI social media operating system. Create one post, intelligently adapt to Instagram, TikTok, X, LinkedIn, Facebook, Threads & YouTube, preview live, and schedule for peak audience windows.",
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
