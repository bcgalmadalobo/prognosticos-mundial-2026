import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://churrasqueira-paraiso-porto.example.com"),
  title: {
    default: "Churrasqueira Paraíso do Porto | Take-away e churrasco no Porto",
    template: "%s | Churrasqueira Paraíso do Porto",
  },
  description:
    "Churrasqueira portuguesa no Porto com foco em take-away, frango no churrasco, pratos tradicionais, encomendas por telefone e direções.",
  openGraph: {
    title: "Churrasqueira Paraíso do Porto",
    description: "Churrasco português, take-away e comida familiar na Rua do Paraíso, Porto.",
    type: "website",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Churrasqueira Paraíso do Porto",
    description: "Churrasco português, take-away e comida familiar na Rua do Paraíso, Porto.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fff7e8] text-[#251a16]">{children}</body>
    </html>
  );
}
