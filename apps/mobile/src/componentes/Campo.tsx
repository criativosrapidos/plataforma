import { forwardRef, useState } from "react";
import { Platform, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from "react-native";
import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { cores, fontes, raio, TOQUE_MIN } from "@/tema";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

export interface CampoProps extends TextInputProps {
  rotulo?: string;
  erro?: string | null;
  dica?: string;
  icone?: LucideIcon;
  senha?: boolean;
}

export const Campo = forwardRef<TextInputInstance, CampoProps>(function Campo(
  { rotulo, erro, dica, icone: Icone, senha, style, onFocus, onBlur, ...props },
  ref,
) {
  const [foco, setFoco] = useState(false);
  const [ver, setVer] = useState(false);
  return (
    <View style={s.grupo}>
      {rotulo ? (
        <Texto variante="corpoForte" style={s.rotulo} nativeID={props.nativeID ? `${props.nativeID}-rotulo` : undefined}>
          {rotulo}
        </Texto>
      ) : null}
      <View style={[s.caixa, foco && s.foco, !!erro && s.comErro]}>
        {Icone ? <Icone size={18} color={cores.tx2} strokeWidth={2.2} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={cores.tx3}
          selectionColor={cores.azul}
          secureTextEntry={senha && !ver}
          accessibilityLabel={rotulo ?? props.placeholder}
          maxFontSizeMultiplier={1.5}
          onFocus={(e) => {
            setFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            onBlur?.(e);
          }}
          style={[s.input, Platform.OS === "web" && ({ outlineStyle: "none" } as object), style]}
          {...props}
        />
        {senha ? (
          <Pressionavel
            onPress={() => setVer((v) => !v)}
            accessibilityLabel={ver ? "Esconder senha" : "Mostrar senha"}
            style={s.olho}
            haptico="selecao"
          >
            {ver ? <EyeOff size={19} color={cores.tx2} /> : <Eye size={19} color={cores.tx2} />}
          </Pressionavel>
        ) : null}
      </View>
      {erro ? (
        <Texto variante="pequeno" cor={cores.vermTexto} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : dica ? (
        <Texto variante="pequeno">{dica}</Texto>
      ) : null}
    </View>
  );
});

const s = StyleSheet.create({
  grupo: { gap: 6 },
  rotulo: { fontSize: 14 },
  caixa: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
    borderRadius: raio.campo,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  foco: { borderColor: cores.azul },
  comErro: { borderColor: cores.verm },
  input: { flex: 1, fontFamily: fontes.medio, fontSize: 16, color: cores.tinta, paddingVertical: 12, minHeight: TOQUE_MIN },
  olho: { width: TOQUE_MIN, height: TOQUE_MIN, alignItems: "center", justifyContent: "center", marginRight: -10 },
});
