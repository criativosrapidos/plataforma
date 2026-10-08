import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Criativos Rápidos — sua agência de marketing com IA",
  description: "Posts, carrosséis, vídeos e anúncios com a cara da sua marca. Você só aprova e baixa.",
};

export const viewport: Viewport = { themeColor: "#FFD400", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
