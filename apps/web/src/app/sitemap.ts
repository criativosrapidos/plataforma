import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";

// Lido a cada pedido: concursos novos entram no sitemap na hora (e o build não depende do banco).
export const dynamic = "force-dynamic";

const PAGINAS: { caminho: string; prioridade: number; frequencia: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { caminho: "/", prioridade: 1, frequencia: "weekly" },
  { caminho: "/concursos", prioridade: 0.9, frequencia: "daily" },
  { caminho: "/planos", prioridade: 0.8, frequencia: "monthly" },
  { caminho: "/como-funciona", prioridade: 0.7, frequencia: "monthly" },
  { caminho: "/fontes", prioridade: 0.6, frequencia: "monthly" },
  { caminho: "/duvidas", prioridade: 0.6, frequencia: "monthly" },
  { caminho: "/baixar", prioridade: 0.6, frequencia: "monthly" },
  { caminho: "/cadastro", prioridade: 0.5, frequencia: "yearly" },
  { caminho: "/termos", prioridade: 0.2, frequencia: "yearly" },
  { caminho: "/privacidade", prioridade: 0.2, frequencia: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const fixas = PAGINAS.map((p) => ({ url: `${base}${p.caminho === "/" ? "" : p.caminho}`, changeFrequency: p.frequencia, priority: p.prioridade }));
  let concursos: { slug: string; atualizado: Date; status: string }[] = [];
  try {
    concursos = await sql`
      select slug, updated_at as atualizado, status from contests
      where publicado ${process.env.SHOW_EXEMPLOS === "1" ? sql`` : sql`and not exemplo`}
      order by updated_at desc limit 45000`;
  } catch (e) {
    console.error("[sitemap] sem acesso ao banco", e);
  }
  return [
    ...fixas,
    ...concursos.map((c) => ({
      url: `${base}/concursos/${c.slug}`,
      lastModified: c.atualizado,
      changeFrequency: (c.status === "edital_aberto" ? "daily" : "weekly") as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: c.status === "edital_aberto" ? 0.8 : 0.6,
    })),
  ];
}
