import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NavBar } from "@/components/NavBar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Prognósticos Mundial 2026",
  description: "Jogo privado de prognósticos do Mundial 2026 entre amigos.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>
          <NavBar />
          {/* pb-16 md:pb-0 reserves space for the mobile bottom nav */}
          <div className="pb-16 md:pb-0">
            {children}
          </div>
        </AuthProvider>
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
