import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-barlow", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-figtree", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Aviso Concurso · Edital, prazo e prova no seu celular", template: "%s · Aviso Concurso" },
  description:
    "O Aviso Concurso lê o Diário Oficial e os sites das bancas todo dia, avisa no celular e junta todos os seus concursos numa agenda só. 3 dias grátis.",
  applicationName: "Aviso Concurso",
  openGraph: { siteName: "Aviso Concurso", locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#1F3FD1", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} ${figtree.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
