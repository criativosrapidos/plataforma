// Trilha de etapas do concurso: previsto → autorizado → banca → edital → prova → resultado.
import { StyleSheet, View } from "react-native";
import { CONTEST_STATUS_LABEL, ETAPAS_TRILHA, type ContestStatus } from "@aviso/shared";
import { etapaAtual } from "@/lib/formato";
import { cores, fontes } from "@/tema";
import { Texto } from "./Texto";

export function Trilha({ status, cor = cores.azul, comRotulos }: { status: ContestStatus; cor?: string; comRotulos?: boolean }) {
  const atual = etapaAtual(status);
  const rotulo = status === "cancelado" ? "Concurso cancelado" : `Etapa: ${CONTEST_STATUS_LABEL[status]}`;
  return (
    <View accessible accessibilityLabel={rotulo} style={{ gap: 6 }}>
      <View style={s.barras}>
        {ETAPAS_TRILHA.map((e, i) => (
          <View key={e.label} style={[s.barra, { backgroundColor: i <= atual ? cor : cores.linha }]} />
        ))}
      </View>
      {comRotulos ? (
        <View style={s.barras}>
          {ETAPAS_TRILHA.map((e, i) => (
            <Texto
              key={e.label}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              style={[s.rotulo, i === atual && { color: cores.tinta, fontFamily: fontes.monoNegrito }]}
            >
              {e.label}
            </Texto>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  barras: { flexDirection: "row", gap: 3 },
  barra: { flex: 1, height: 6, borderRadius: 3 },
  rotulo: { flex: 1, fontFamily: fontes.mono, fontSize: 9, lineHeight: 13, color: cores.tx2, textAlign: "center", letterSpacing: -0.2 },
});
