import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Prognosticos Mundial 2026",
  description: "Jogo privado de prognosticos do Mundial 2026 entre amigos.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
