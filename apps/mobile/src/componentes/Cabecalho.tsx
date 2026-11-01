import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { cores, TOQUE_MIN } from "@/tema";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

/** Topo das abas: linha pequena ("Bom dia, Ana") + título grande em Barlow Condensed. */
export function Cabecalho({ sobre, titulo, direita, selo }: { sobre?: string; titulo: string; direita?: ReactNode; selo?: ReactNode }) {
  return (
    <View style={s.topo}>
      <View style={s.textos}>
        {sobre ? (
          <Texto variante="meta" style={s.sobre} numberOfLines={1}>
            {sobre}
          </Texto>
        ) : null}
        <Texto variante="titulo" accessibilityRole="header">
          {titulo}
        </Texto>
        {selo}
      </View>
      {direita ? <View style={s.direita}>{direita}</View> : null}
    </View>
  );
}

/** Botão redondo branco (sino, voltar, ações do topo). */
export function BotaoRedondo({
  children,
  onPress,
  rotulo,
  testID,
}: {
  children: ReactNode;
  onPress: () => void;
  rotulo: string;
  testID?: string;
}) {
  return (
    <Pressionavel testID={testID} onPress={onPress} accessibilityLabel={rotulo} escala={0.92} style={s.redondo}>
      {children}
    </Pressionavel>
  );
}

/** Barra de topo das telas empilhadas: voltar + ações. */
export function BarraVoltar({ direita, aoVoltar }: { direita?: ReactNode; aoVoltar?: () => void }) {
  return (
    <View style={s.barra}>
      <BotaoRedondo
        rotulo="Voltar"
        onPress={() => {
          if (aoVoltar) aoVoltar();
          else if (router.canGoBack()) router.back();
          else router.replace("/");
        }}
      >
        <ChevronLeft size={24} color={cores.tinta} strokeWidth={2.4} />
      </BotaoRedondo>
      <View style={s.acoes}>{direita}</View>
    </View>
  );
}

/** Título de seção com ação opcional à direita ("Ver todos"). */
export function Secao({ titulo, acao, aoAcao, testID }: { titulo: string; acao?: string; aoAcao?: () => void; testID?: string }) {
  return (
    <View style={s.secao}>
      <Texto variante="h2" accessibilityRole="header" style={{ flexShrink: 1 }}>
        {titulo}
      </Texto>
      {acao && aoAcao ? (
        <Pressionavel testID={testID} onPress={aoAcao} haptico="selecao" style={s.secaoAcao} accessibilityLabel={acao}>
          <Texto variante="corpoForte" cor={cores.azul} style={{ fontSize: 13.5 }}>
            {acao}
          </Texto>
        </Pressionavel>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 12, paddingTop: 6 },
  textos: { flex: 1, gap: 4, alignItems: "flex-start" },
  sobre: { fontSize: 14 },
  direita: { flexDirection: "row", gap: 8, paddingBottom: 2 },
  redondo: {
    width: TOQUE_MIN,
    height: TOQUE_MIN,
    borderRadius: TOQUE_MIN / 2,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.linha,
    alignItems: "center",
    justifyContent: "center",
  },
  barra: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: TOQUE_MIN },
  acoes: { flexDirection: "row", gap: 8, alignItems: "center" },
  secao: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 12 },
  secaoAcao: { minHeight: TOQUE_MIN, justifyContent: "center", paddingHorizontal: 4 },
});
