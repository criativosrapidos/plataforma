// Controles de formulário: interruptor, caixa de marcar, segmentado.
import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { cores, fontes, TOQUE_MIN } from "@/tema";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

const MOLA = { damping: 16, stiffness: 260, mass: 0.7 };

/** Interruptor (switch) da marca: verde quando ligado. */
export function Interruptor({
  ligado,
  aoMudar,
  rotulo,
  desabilitado,
  testID,
}: {
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  rotulo: string;
  desabilitado?: boolean;
  testID?: string;
}) {
  const p = useSharedValue(ligado ? 1 : 0);
  useEffect(() => {
    p.set(withSpring(ligado ? 1 : 0, MOLA));
  }, [ligado, p]);
  const trilho = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [cores.linhaForte, cores.verde]) }));
  const bola = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 20 }] }));
  return (
    <Pressionavel
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: ligado, disabled: desabilitado }}
      disabled={desabilitado}
      haptico="selecao"
      escala={0.94}
      hitSlop={10}
      onPress={() => aoMudar(!ligado)}
      style={[s.toque, desabilitado && { opacity: 0.5 }]}
    >
      <Animated.View style={[s.trilho, trilho]}>
        <Animated.View style={[s.bola, bola]} />
      </Animated.View>
    </Pressionavel>
  );
}

/** Caixa de marcar animada (checklist). */
export function CaixaMarcar({ marcado, cor = cores.verde }: { marcado: boolean; cor?: string }) {
  const p = useSharedValue(marcado ? 1 : 0);
  useEffect(() => {
    p.set(withTiming(marcado ? 1 : 0, { duration: 160 }));
  }, [marcado, p]);
  const caixa = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [cores.branco, cor]),
    borderColor: interpolateColor(p.value, [0, 1], [cores.linhaForte, cor]),
  }));
  const visto = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.4 + p.value * 0.6 }] }));
  return (
    <Animated.View style={[s.caixa, caixa]}>
      <Animated.View style={visto}>
        <Check size={15} color={cores.branco} strokeWidth={3.4} />
      </Animated.View>
    </Animated.View>
  );
}

/** Controle segmentado (Semana | Mês, Acompanhando | Explorar | Radar). */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  aoMudar,
  style,
}: {
  opcoes: { valor: T; rotulo: string; selo?: React.ReactNode }[];
  valor: T;
  aoMudar: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.seg, style]} accessibilityRole="tablist">
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressionavel
            key={o.valor}
            testID={`seg-${o.valor}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={o.rotulo}
            haptico="selecao"
            escala={0.97}
            onPress={() => aoMudar(o.valor)}
            style={[s.segItem, ativo && s.segAtivo]}
          >
            <Texto numberOfLines={1} style={[s.segTexto, ativo && { color: cores.branco }]}>
              {o.rotulo}
            </Texto>
            {o.selo}
          </Pressionavel>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  toque: { minHeight: TOQUE_MIN, justifyContent: "center" },
  trilho: { width: 48, height: 28, borderRadius: 999, padding: 3 },
  bola: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: cores.branco,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  caixa: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  seg: {
    flexDirection: "row",
    backgroundColor: cores.branco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 4,
    gap: 4,
  },
  segItem: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 6,
  },
  segAtivo: { backgroundColor: cores.tinta },
  segTexto: { fontFamily: fontes.negrito, fontSize: 13.5, lineHeight: 18, color: cores.tx2 },
});
