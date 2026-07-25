import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { AppHydration } from "@/components/common/app-hydration";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const SITE_DESCRIPTION = "Imperial Collection — boutique de mode et sourcing de luxe, France ↔ Cameroun.";

export const metadata: Metadata = {
  title: "Imperial Collection",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "Imperial Collection",
    description: SITE_DESCRIPTION,
    siteName: "Imperial Collection",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col bg-imperial-ivory font-body text-imperial-black antialiased">
        <AppHydration />
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <WhatsAppButton variant="floating" />
      </body>
    </html>
  );
}
