import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Check, type LucideIcon } from "lucide-react-native";
import { cores, fontes, TOQUE_MIN } from "@/tema";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

export interface ChipProps {
  rotulo: string;
  ativo?: boolean;
  onPress?: () => void;
  /** Bolinha com a cor do concurso. */
  cor?: string;
  icone?: LucideIcon;
  /** "filtro": apagado quando inativo (agenda/matérias). "selecao": preenche quando ativo (formulários). */
  modo?: "filtro" | "selecao";
  style?: StyleProp<ViewStyle>;
  rotuloAcessivel?: string;
  testID?: string;
}

export function Chip({ rotulo, ativo = false, onPress, cor, icone: Icone, modo = "selecao", style, rotuloAcessivel, testID }: ChipProps) {
  const selecao = modo === "selecao";
  const preenchido = selecao && ativo;
  const desligado = !selecao && !ativo;
  const corTexto = preenchido ? cores.branco : desligado ? cores.tx2 : cores.tinta;
  return (
    <Pressionavel
      testID={testID}
      onPress={onPress}
      haptico="selecao"
      escala={0.95}
      accessibilityRole={selecao ? "checkbox" : "button"}
      accessibilityState={selecao ? { checked: ativo } : { selected: ativo }}
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[s.chip, preenchido && s.preenchido, desligado && s.desligado, !selecao && ativo && cor ? { borderColor: cor } : null, style]}
    >
      {cor ? <View style={[s.bolinha, desligado ? { borderWidth: 2, borderColor: cor } : { backgroundColor: cor }]} /> : null}
      {Icone ? <Icone size={15} color={corTexto} strokeWidth={2.4} /> : null}
      <Texto style={[s.texto, { color: corTexto }]} numberOfLines={1}>
        {rotulo}
      </Texto>
      {preenchido ? <Check size={14} color={cores.branco} strokeWidth={3} /> : null}
    </Pressionavel>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
    borderRadius: 999,
    paddingHorizontal: 13,
    minHeight: TOQUE_MIN - 4,
  },
  preenchido: { backgroundColor: cores.azul, borderColor: cores.azul },
  desligado: { backgroundColor: "transparent", borderStyle: "dashed", borderColor: cores.linhaForte },
  bolinha: { width: 10, height: 10, borderRadius: 5 },
  texto: { fontFamily: fontes.negrito, fontSize: 13, lineHeight: 17 },
});
