// Identidade Aviso Concurso: caneta azul, marca-texto e gabarito.
// Os tons "*Texto" são versões mais escuras usadas em texto pequeno para manter contraste AA (4,5:1).
import { Platform } from "react-native";

export const cores = {
  azul: "#1F3FD1",
  azul2: "#162FA3",
  azulT: "#E8ECFC",
  azulSuave: "#C9D0F5",
  azulTextoClaro: "#DCE2FB",
  marca: "#FFE14D",
  marcaT: "#FFF7CC",
  ambar: "#7A5B00",
  papel: "#F5F6F1",
  branco: "#FFFFFF",
  tinta: "#0F1530",
  tx2: "#4F566E",
  tx3: "#6B7186",
  linha: "#E1E3EA",
  linhaForte: "#C9CDD8",
  verde: "#0E8A45",
  verdeTexto: "#0B6E37",
  verdeT: "#E3F4EA",
  verm: "#D93A40",
  vermTexto: "#B42318",
  vermT: "#FBE7E8",
  fundoWeb: "#E4E6EC",
  sombra: "#0F1530",
} as const;

export const fontes = {
  display: "BarlowCondensed_800ExtraBold",
  displaySemi: "BarlowCondensed_600SemiBold",
  regular: "Figtree_400Regular",
  medio: "Figtree_500Medium",
  semi: "Figtree_600SemiBold",
  negrito: "Figtree_700Bold",
  extra: "Figtree_800ExtraBold",
  mono: "JetBrainsMono_500Medium",
  monoNegrito: "JetBrainsMono_700Bold",
} as const;

export const raio = { card: 20, cardMenor: 16, botao: 14, campo: 14, pilula: 999, hero: 26 } as const;

/** Largura máxima do conteúdo (web e tablets): o app fica centralizado como um celular. */
export const LARGURA_MAX = 560;

/** Alvo mínimo de toque. */
export const TOQUE_MIN = 44;

export const sombra = Platform.select({
  web: { boxShadow: "0 1px 2px rgba(15,21,48,.04), 0 8px 24px rgba(15,21,48,.06)" },
  default: { shadowColor: cores.sombra, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
}) as object;

export const sombraForte = Platform.select({
  web: { boxShadow: "0 12px 32px rgba(15,21,48,.22)" },
  default: { shadowColor: cores.sombra, shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
}) as object;

/** Texto legível sobre uma cor de concurso (todas as cores da paleta pedem texto branco). */
export function textoSobre(cor: string): string {
  return cor.toUpperCase() === cores.marca ? cores.tinta : cores.branco;
}

/** Mistura a cor do concurso com branco (fundo suave para etiquetas e realces). */
export function corSuave(hex: string, quanto = 0.88): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * quanto);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
