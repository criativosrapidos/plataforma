import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { DATE_TIPO_LABEL, periodoBR, type CompromissoDTO } from "@aviso/shared";
import { contagemTexto, dataChave, diasAte, MESES_ABREV, partes } from "@/lib/formato";
import { cores, fontes } from "@/tema";
import { Card } from "./Card";
import { Texto } from "./Texto";

/** Compromisso na agenda: faixa com a cor do concurso, dia grande em mono, tipo e contagem. */
export function LinhaCompromisso({ c, hoje }: { c: CompromissoDTO; hoje: string }) {
  const chave = dataChave(c) ?? hoje;
  const { dia, mes } = partes(chave);
  const faltam = diasAte(chave, hoje);
  const urgente = faltam >= 0 && faltam <= 2 && c.tipo !== "resultado" && c.tipo !== "gabarito";
  const prova = c.tipo === "prova";
  const passou = faltam < 0;
  const titulo = `${DATE_TIPO_LABEL[c.tipo]} · ${c.concurso}`;
  const periodo = c.inicio && c.fim && c.inicio !== c.fim ? periodoBR(c.inicio, c.fim) : null;
  const meta = [periodo, c.descricao].filter(Boolean).join(" · ");
  const conta = passou && c.inicio && c.fim && diasAte(c.inicio, hoje) <= 0 ? "em andamento" : contagemTexto(chave, hoje);
  return (
    <Card
      corEsquerda={c.cor}
      onPress={() => router.push(`/concurso/${c.contest_id}`)}
      rotuloAcessivel={`${titulo}. ${meta}. ${conta}`}
      style={[s.card, prova && s.prova]}
    >
      <View style={s.data}>
        <Texto style={s.dia} maxFontSizeMultiplier={1.2}>
          {dia}
        </Texto>
        <Texto style={s.mes} maxFontSizeMultiplier={1.2}>
          {MESES_ABREV[mes - 1]}
        </Texto>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="h3" numberOfLines={2}>
          {titulo}
        </Texto>
        {meta ? (
          <Texto variante="meta" numberOfLines={2}>
            {meta}
          </Texto>
        ) : null}
        <Texto variante="monoForte" cor={urgente ? cores.vermTexto : prova ? cores.azul : cores.tx2} style={{ fontSize: 12 }}>
          {conta}
        </Texto>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 18 },
  prova: { backgroundColor: "#FBFBFE" },
  data: { width: 46, alignItems: "center" },
  dia: { fontFamily: fontes.monoNegrito, fontSize: 21, lineHeight: 25, color: cores.tinta },
  mes: { fontFamily: fontes.monoNegrito, fontSize: 11.5, lineHeight: 14, color: cores.tx2, letterSpacing: 0.6 },
});
