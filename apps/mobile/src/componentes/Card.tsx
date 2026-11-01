import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { cores, raio } from "@/tema";
import { Pressionavel } from "./Pressionavel";

export interface CardProps extends ViewProps {
  /** Faixa colorida no topo (cor do concurso). */
  corTopo?: string;
  /** Faixa colorida à esquerda (compromisso na agenda). */
  corEsquerda?: string;
  onPress?: () => void;
  rotuloAcessivel?: string;
  style?: StyleProp<ViewStyle>;
  semPadding?: boolean;
}

export function Card({ corTopo, corEsquerda, onPress, rotuloAcessivel, style, semPadding, children, ...props }: CardProps) {
  const estilo = [
    s.card,
    semPadding && s.semPadding,
    corTopo ? { borderTopWidth: 5, borderTopColor: corTopo } : null,
    corEsquerda ? { borderLeftWidth: 6, borderLeftColor: corEsquerda } : null,
    style,
  ];
  if (onPress) {
    return (
      <Pressionavel
        onPress={onPress}
        escala={0.985}
        accessibilityLabel={rotuloAcessivel}
        semPapel={Platform.OS === "web" && !props.accessibilityRole}
        style={estilo}
        {...props}
      >
        {children}
      </Pressionavel>
    );
  }
  return (
    <View style={estilo} {...props}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    overflow: "hidden",
  },
  semPadding: { paddingVertical: 0, paddingHorizontal: 0, gap: 0 },
});
