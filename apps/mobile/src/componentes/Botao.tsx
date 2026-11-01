import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { cores, fontes, raio, TOQUE_MIN } from "@/tema";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

export type VarianteBotao = "primario" | "secundario" | "marca" | "perigo" | "fantasma" | "sucesso" | "escuro";

const VARIANTES: Record<VarianteBotao, { fundo: string; texto: string; borda?: string }> = {
  primario: { fundo: cores.azul, texto: cores.branco },
  secundario: { fundo: cores.branco, texto: cores.tinta, borda: cores.linha },
  marca: { fundo: cores.marca, texto: cores.tinta },
  perigo: { fundo: cores.vermT, texto: cores.vermTexto },
  fantasma: { fundo: "transparent", texto: cores.azul },
  sucesso: { fundo: cores.verdeTexto, texto: cores.branco },
  escuro: { fundo: cores.tinta, texto: cores.branco },
};

export interface BotaoProps {
  titulo: string;
  onPress?: () => void;
  variante?: VarianteBotao;
  tamanho?: "g" | "m" | "p";
  icone?: LucideIcon;
  iconeDireita?: LucideIcon;
  carregando?: boolean;
  desabilitado?: boolean;
  bloco?: boolean;
  style?: StyleProp<ViewStyle>;
  rotuloAcessivel?: string;
  testID?: string;
}

const ALTURA = { g: 54, m: 46, p: TOQUE_MIN };
const FONTE = { g: 16, m: 15, p: 13.5 };

export function Botao({
  titulo,
  onPress,
  variante = "primario",
  tamanho = "m",
  icone: Icone,
  iconeDireita: IconeDireita,
  carregando,
  desabilitado,
  bloco,
  style,
  rotuloAcessivel,
  testID,
}: BotaoProps) {
  const v = VARIANTES[variante];
  const inativo = desabilitado || carregando;
  const tamIcone = tamanho === "p" ? 16 : 18;
  return (
    <Pressionavel
      testID={testID}
      onPress={onPress}
      disabled={inativo}
      accessibilityLabel={rotuloAcessivel ?? titulo}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      style={[
        s.base,
        {
          minHeight: ALTURA[tamanho],
          backgroundColor: v.fundo,
          borderColor: v.borda ?? "transparent",
          paddingHorizontal: tamanho === "p" ? 14 : variante === "fantasma" ? 8 : 20,
          borderRadius: tamanho === "g" ? 16 : raio.botao,
        },
        bloco && s.bloco,
        desabilitado && !carregando && s.desabilitado,
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <View style={s.linha}>
          {Icone ? <Icone size={tamIcone} color={v.texto} strokeWidth={2.4} /> : null}
          <Texto
            numberOfLines={1}
            style={{ color: v.texto, fontFamily: fontes.extra, fontSize: FONTE[tamanho], lineHeight: FONTE[tamanho] + 5 }}
          >
            {titulo}
          </Texto>
          {IconeDireita ? <IconeDireita size={tamIcone} color={v.texto} strokeWidth={2.4} /> : null}
        </View>
      )}
    </Pressionavel>
  );
}

const s = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", borderWidth: 1.5, alignSelf: "flex-start" },
  bloco: { alignSelf: "stretch" },
  linha: { flexDirection: "row", alignItems: "center", gap: 8 },
  desabilitado: { opacity: 0.45 },
});
