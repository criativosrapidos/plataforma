// Esqueleto de carregamento: blocos que "respiram" enquanto os dados chegam.
import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { cores, raio } from "@/tema";

export function Esqueleto({
  largura = "100%",
  altura = 14,
  arredondado = 8,
  style,
}: {
  largura?: DimensionValue;
  altura?: DimensionValue;
  arredondado?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const o = useSharedValue(0.55);
  useEffect(() => {
    o.set(withRepeat(withTiming(1, { duration: 760, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [o]);
  const animado = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[{ width: largura, height: altura, borderRadius: arredondado, backgroundColor: "#E7E9EF" }, style, animado]} />
  );
}

/** Card genérico de carregamento. */
export function EsqueletoCard({ linhas = 3, alto }: { linhas?: number; alto?: boolean }) {
  return (
    <View style={s.card} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      <Esqueleto largura={96} altura={18} arredondado={999} />
      <Esqueleto largura="72%" altura={16} />
      {Array.from({ length: linhas - 1 }).map((_, i) => (
        <Esqueleto key={i} largura={i % 2 ? "54%" : "88%"} altura={12} />
      ))}
      {alto ? <Esqueleto altura={44} arredondado={12} style={{ marginTop: 6 }} /> : null}
    </View>
  );
}

export function EsqueletoLista({ quantos = 3, linhas = 3 }: { quantos?: number; linhas?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: quantos }).map((_, i) => (
        <EsqueletoCard key={i} linhas={linhas} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.linha, borderRadius: raio.card, padding: 16, gap: 10 },
});
