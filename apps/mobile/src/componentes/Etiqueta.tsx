import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { TomEtiqueta } from "@/lib/formato";
import { cores, fontes } from "@/tema";
import { Texto } from "./Texto";

// Tons com contraste AA (texto pequeno ≥ 4,5:1 sobre o fundo claro).
const TONS: Record<TomEtiqueta, { fundo: string; texto: string }> = {
  aberto: { fundo: cores.verdeT, texto: cores.verdeTexto },
  encerra: { fundo: cores.vermT, texto: cores.vermTexto },
  errata: { fundo: cores.marcaT, texto: cores.ambar },
  info: { fundo: cores.azulT, texto: cores.azul },
  neutro: { fundo: "#ECEDF1", texto: cores.tx2 },
  marca: { fundo: cores.marca, texto: cores.tinta },
};

export function Etiqueta({ texto, tom = "neutro", style }: { texto: string; tom?: TomEtiqueta; style?: StyleProp<ViewStyle> }) {
  const t = TONS[tom];
  return (
    <View style={[s.pilula, { backgroundColor: t.fundo }, style]}>
      <Texto variante="rotulo" maxFontSizeMultiplier={1.3} style={[s.texto, { color: t.texto }]} numberOfLines={1}>
        {texto}
      </Texto>
    </View>
  );
}

/** Selo "APROVADO" dos recursos do plano completo. */
export function SeloAprovado({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.selo, style]} accessibilityLabel="Recurso do plano Aprovado">
      <Texto maxFontSizeMultiplier={1.2} style={s.seloTexto}>
        APROVADO
      </Texto>
    </View>
  );
}

const s = StyleSheet.create({
  pilula: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  texto: { fontSize: 10.5, lineHeight: 14, letterSpacing: 0.8 },
  selo: { backgroundColor: cores.marca, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, alignSelf: "center" },
  seloTexto: { fontFamily: fontes.monoNegrito, fontSize: 10, lineHeight: 13, letterSpacing: 0.4, color: cores.tinta },
});
