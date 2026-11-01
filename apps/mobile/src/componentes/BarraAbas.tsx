// Barra de abas da marca: ícone + rótulo, pílula azul clara atrás do ícone ativo, ponto amarelo de aviso novo.
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { BookOpen, CalendarDays, FileText, House, Settings, type LucideIcon } from "lucide-react-native";
import { useSessao } from "@/contexto/Sessao";
import { cores, fontes } from "@/tema";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

const ICONES: Record<string, LucideIcon> = {
  index: House,
  agenda: CalendarDays,
  materias: BookOpen,
  concursos: FileText,
  ajustes: Settings,
};

export function BarraAbas({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { me } = useSessao();
  const naoLidos = me?.contagens.avisosNaoLidos ?? 0;
  return (
    <View style={[s.barra, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
      {state.routes.map((rota, i) => {
        const focada = i === state.index;
        const { options } = descriptors[rota.key];
        const rotulo = typeof options.title === "string" ? options.title : rota.name;
        const Icone = ICONES[rota.name] ?? FileText;
        const badge = rota.name === "index" && naoLidos > 0;
        return (
          <Item
            key={rota.key}
            rotulo={rotulo}
            icone={Icone}
            focada={focada}
            badge={badge}
            testID={`aba-${rota.name}`}
            rotuloAcessivel={badge ? `${rotulo}, ${naoLidos} ${naoLidos === 1 ? "aviso novo" : "avisos novos"}` : rotulo}
            onPress={() => {
              const ev = emitter.emit({ type: "tabPress", target: rota.key, canPreventDefault: true });
              if (!focada && !ev.defaultPrevented) navigateToTab(rota.key);
            }}
          />
        );
      })}
    </View>
  );
}

function Item({
  rotulo,
  icone: Icone,
  focada,
  badge,
  onPress,
  testID,
  rotuloAcessivel,
}: {
  rotulo: string;
  icone: LucideIcon;
  focada: boolean;
  badge: boolean;
  onPress: () => void;
  testID: string;
  rotuloAcessivel: string;
}) {
  const p = useSharedValue(focada ? 1 : 0);
  useEffect(() => {
    p.set(withSpring(focada ? 1 : 0, { damping: 15, stiffness: 240 }));
  }, [focada, p]);
  const pilula = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scaleX: 0.6 + p.value * 0.4 }] }));
  const icone = useAnimatedStyle(() => ({ transform: [{ translateY: -p.value * 1 }, { scale: 1 + p.value * 0.06 }] }));
  const cor = focada ? cores.azul : cores.tx2;
  return (
    <Pressionavel
      testID={testID}
      onPress={onPress}
      haptico="selecao"
      escala={0.92}
      accessibilityRole="tab"
      accessibilityState={{ selected: focada }}
      accessibilityLabel={rotuloAcessivel}
      style={s.item}
    >
      <View style={s.iconeCaixa}>
        <Animated.View style={[s.pilula, pilula]} />
        <Animated.View style={icone}>
          <Icone size={22} color={cor} strokeWidth={focada ? 2.4 : 2} />
        </Animated.View>
        {badge ? <View style={s.badge} /> : null}
      </View>
      <Texto maxFontSizeMultiplier={1.2} numberOfLines={1} style={[s.rotulo, { color: cor }, focada && { fontFamily: fontes.extra }]}>
        {rotulo}
      </Texto>
    </Pressionavel>
  );
}

const s = StyleSheet.create({
  barra: {
    flexDirection: "row",
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 52 },
  iconeCaixa: { width: 56, height: 30, alignItems: "center", justifyContent: "center" },
  pilula: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 15, backgroundColor: cores.azulT },
  badge: {
    position: "absolute",
    top: 2,
    right: 14,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: cores.marca,
    borderWidth: 2,
    borderColor: cores.branco,
  },
  rotulo: { fontFamily: fontes.negrito, fontSize: 11, lineHeight: 14 },
});
