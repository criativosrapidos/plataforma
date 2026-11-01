import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";

/** Fontes da marca para o ImageResponse (woff, lidas do disco). */
export async function fontesOG() {
  const ler = (f: string) => readFile(join(process.cwd(), "assets/og", f));
  const [b800, b600, f500, f700] = await Promise.all([
    ler("barlow-condensed-latin-800-normal.woff"),
    ler("barlow-condensed-latin-600-normal.woff"),
    ler("figtree-latin-500-normal.woff"),
    ler("figtree-latin-700-normal.woff"),
  ]);
  return [
    { name: "Barlow", data: b800, weight: 800 as const, style: "normal" as const },
    { name: "Barlow", data: b600, weight: 600 as const, style: "normal" as const },
    { name: "Figtree", data: f500, weight: 500 as const, style: "normal" as const },
    { name: "Figtree", data: f700, weight: 700 as const, style: "normal" as const },
  ];
}

export function SimboloOG({ tamanho = 64, escuro = true }: { tamanho?: number; escuro?: boolean }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
      <circle cx="46" cy="54" r="38" fill={escuro ? "#3D5AF0" : "#1F3FD1"} />
      <rect x="40" y="30" width="12" height="32" rx="6" fill="#FFFFFF" />
      <circle cx="46" cy="75" r="6.5" fill="#FFFFFF" />
      <circle cx="80" cy="20" r="15" fill="#FFE14D" stroke={escuro ? "#0F1530" : "#F5F6F1"} strokeWidth="6" />
    </svg>
  );
}

/** Moldura padrão das imagens de compartilhamento: fundo tinta, marca no topo, rodapé com o site. */
export function MolduraOG({ children, rodape }: { children: ReactNode; rodape?: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0F1530",
        color: "#FFFFFF",
        padding: "64px 72px",
        fontFamily: "Figtree",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -140,
          top: -140,
          width: 520,
          height: 520,
          borderRadius: 999,
          border: "48px solid rgba(255,255,255,0.05)",
          display: "flex",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <SimboloOG tamanho={60} />
        <div style={{ display: "flex", fontFamily: "Barlow", fontSize: 46, lineHeight: 1 }}>
          <span style={{ fontWeight: 800 }}>aviso</span>
          <span style={{ fontWeight: 600, color: "#C9D1FF" }}>concurso</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: "rgba(255,255,255,0.75)" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {["A", "B", "C", "D", "E"].map((l) => (
            <div
              key={l}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: l === "C" ? "3px solid #FFE14D" : "3px solid rgba(255,255,255,0.7)",
                background: l === "C" ? "#FFE14D" : "transparent",
                color: l === "C" ? "#0F1530" : "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {l}
            </div>
          ))}
        </div>
        <div style={{ display: "flex" }}>{rodape ?? "avisoconcurso.com.br · 3 dias grátis"}</div>
      </div>
    </div>
  );
}
