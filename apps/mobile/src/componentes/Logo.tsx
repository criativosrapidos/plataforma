// Símbolo: bolinha de gabarito azul com "!" branco e ponto amarelo de notificação.
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { cores, fontes } from "@/tema";
import { Texto } from "./Texto";

export function Simbolo({ tamanho = 40, borda = cores.papel }: { tamanho?: number; borda?: string }) {
  return (
    <View aria-hidden style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
        <Circle cx={46} cy={54} r={38} fill={cores.azul} />
        <Rect x={40} y={30} width={12} height={32} rx={6} fill={cores.branco} />
        <Circle cx={46} cy={75} r={6.5} fill={cores.branco} />
        <Circle cx={80} cy={20} r={15} fill={cores.marca} stroke={borda} strokeWidth={6} />
      </Svg>
    </View>
  );
}

/** Logo completo: símbolo + "aviso" (800) "concurso" (600) em Barlow Condensed. */
export function Marca({ tamanho = 34, cor = cores.tinta, borda }: { tamanho?: number; cor?: string; borda?: string }) {
  return (
    <View style={s.linha} accessible accessibilityLabel="Aviso Concurso" accessibilityRole="image">
      <Simbolo tamanho={tamanho * 1.18} borda={borda} />
      <Texto maxFontSizeMultiplier={1} style={{ fontFamily: fontes.display, fontSize: tamanho, lineHeight: tamanho * 1.05, color: cor }}>
        aviso
        <Texto maxFontSizeMultiplier={1} style={{ fontFamily: fontes.displaySemi, fontSize: tamanho, color: cor }}>
          concurso
        </Texto>
      </Texto>
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center", gap: 8 },
});
