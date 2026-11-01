// Telas de estado global: carregando a sessão e sem conexão.
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { WifiOff } from "lucide-react-native";
import { cores } from "@/tema";
import { Botao } from "./Botao";
import { Simbolo } from "./Logo";
import { Texto } from "./Texto";

export function TelaCarregando() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [p]);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: 1 + p.value * 0.06 }], opacity: 0.85 + p.value * 0.15 }));
  return (
    <View style={s.centro} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      <Animated.View style={animado}>
        <Simbolo tamanho={84} />
      </Animated.View>
    </View>
  );
}

export function TelaSemConexao({ aoTentar }: { aoTentar: () => void }) {
  return (
    <View style={s.centro}>
      <View style={s.icone}>
        <WifiOff size={30} color={cores.azul} strokeWidth={2.2} />
      </View>
      <Texto variante="tituloMedio" centro>
        Sem conexão
      </Texto>
      <Texto variante="corpo" cor={cores.tx2} centro style={{ maxWidth: 300 }}>
        Não deu para falar com o Aviso Concurso agora. Confira a internet e tente de novo.
      </Texto>
      <Botao titulo="Tentar de novo" onPress={aoTentar} style={{ alignSelf: "center", marginTop: 8 }} />
    </View>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: cores.papel },
  icone: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: cores.azulT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
});
