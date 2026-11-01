import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";
import { cores, fontes } from "@/tema";

export type VarianteTexto =
  | "titulo" // título de tela: Barlow Condensed 800 caixa alta
  | "tituloMedio"
  | "display" // números grandes (contagem regressiva)
  | "h2" // título de seção
  | "h3" // título de card
  | "corpo"
  | "corpoForte"
  | "meta" // texto secundário
  | "pequeno"
  | "rotulo" // JetBrains Mono caixa alta (etiquetas, rótulos)
  | "mono"
  | "monoForte";

const estilos: Record<VarianteTexto, TextStyle> = {
  titulo: { fontFamily: fontes.display, fontSize: 34, lineHeight: 34, textTransform: "uppercase", letterSpacing: -0.2 },
  tituloMedio: { fontFamily: fontes.display, fontSize: 26, lineHeight: 27, textTransform: "uppercase", letterSpacing: -0.1 },
  display: { fontFamily: fontes.display, fontSize: 46, lineHeight: 46, textTransform: "uppercase" },
  h2: { fontFamily: fontes.extra, fontSize: 17, lineHeight: 22 },
  h3: { fontFamily: fontes.extra, fontSize: 15, lineHeight: 20 },
  corpo: { fontFamily: fontes.regular, fontSize: 15, lineHeight: 22 },
  corpoForte: { fontFamily: fontes.negrito, fontSize: 15, lineHeight: 22 },
  meta: { fontFamily: fontes.regular, fontSize: 13, lineHeight: 18, color: cores.tx2 },
  pequeno: { fontFamily: fontes.medio, fontSize: 12, lineHeight: 16, color: cores.tx2 },
  rotulo: { fontFamily: fontes.monoNegrito, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: "uppercase" },
  mono: { fontFamily: fontes.mono, fontSize: 13, lineHeight: 18 },
  monoForte: { fontFamily: fontes.monoNegrito, fontSize: 13, lineHeight: 18 },
};

// Títulos grandes crescem menos com a fonte do sistema para não quebrar o layout.
const limiteEscala: Partial<Record<VarianteTexto, number>> = { titulo: 1.25, tituloMedio: 1.3, display: 1.2, rotulo: 1.4 };

export interface TextoProps extends TextProps {
  variante?: VarianteTexto;
  cor?: string;
  centro?: boolean;
}

export function Texto({ variante = "corpo", cor, centro, style, maxFontSizeMultiplier, ...props }: TextoProps) {
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? limiteEscala[variante] ?? 1.6}
      style={[base.texto, estilos[variante], cor ? { color: cor } : null, centro && base.centro, style]}
      {...props}
    />
  );
}

const base = StyleSheet.create({
  texto: { color: cores.tinta },
  centro: { textAlign: "center" },
});
