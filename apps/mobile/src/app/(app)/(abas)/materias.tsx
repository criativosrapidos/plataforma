// Matérias em comum: o que cai em mais concursos primeiro, depois por questões somadas.
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { BookOpen, Lightbulb } from "lucide-react-native";
import type { MateriasEmComumResponse } from "@aviso/shared";
import { useAtualizarAcompanhamento, useMaterias } from "@/api/consultas";
import { mensagemDeErro } from "@/api/cliente";
import { Card } from "@/componentes/Card";
import { Cabecalho } from "@/componentes/Cabecalho";
import { Chip } from "@/componentes/Chip";
import { EsqueletoLista } from "@/componentes/Esqueleto";
import { EstadoErro, EstadoVazio } from "@/componentes/EstadoVazio";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { siglaBolinha } from "@/lib/formato";
import { cores, fontes } from "@/tema";

type Concurso = MateriasEmComumResponse["concursos"][number];

export default function Materias() {
  const q = useMaterias();
  const atualizar = useAtualizarAcompanhamento();
  const toast = useToast();
  const concursos = q.data?.concursos ?? [];
  const ativos = concursos.filter((c) => c.ativo);
  const materias = q.data?.materias ?? [];
  const max = Math.max(1, ...materias.map((m) => m.questoesTotal));
  const recalculando = atualizar.isPending || (q.isFetching && !q.isPending);

  function alternar(c: Concurso) {
    if (c.ativo && ativos.length === 1) {
      toast.mostrar("Deixe pelo menos um concurso ligado.", "info");
      return;
    }
    atualizar.mutate(
      { contestId: c.contest_id, dados: { nas_materias: !c.ativo } },
      { onError: (e) => toast.mostrar(mensagemDeErro(e), "erro") },
    );
  }

  return (
    <Tela areaSeguraBaixo={false} aoAtualizar={() => q.refetch()} testID="tela-materias">
      <Cabecalho
        sobre={concursos.length ? `${concursos.length === 1 ? "Seu concurso" : `Seus ${concursos.length} concursos`}` : "Seus concursos"}
        titulo="Matérias em comum"
      />

      {q.isPending ? (
        <EsqueletoLista quantos={4} linhas={2} />
      ) : q.isError ? (
        <EstadoErro mensagem={mensagemDeErro(q.error)} aoTentar={() => void q.refetch()} />
      ) : !concursos.length ? (
        <EstadoVazio
          icone={BookOpen}
          titulo="Acompanhe concursos para comparar"
          texto="A gente lê o conteúdo programático de cada edital e mostra primeiro o que cai em mais concursos."
          acao="Explorar concursos"
          aoAcao={() => router.navigate("/concursos?aba=explorar")}
        />
      ) : (
        <>
          <View style={s.dica}>
            <Lightbulb size={18} color={cores.ambar} strokeWidth={2.4} style={{ marginTop: 1 }} />
            <Texto variante="corpo" style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>
              Lido do conteúdo programático de cada edital. O que cai em mais concursos aparece primeiro. Toque num concurso para ligar ou
              desligar.
            </Texto>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -16 }}
            contentContainerStyle={s.filtros}
            accessibilityLabel="Concursos considerados"
          >
            {concursos.map((c) => (
              <Chip
                key={c.contest_id}
                modo="filtro"
                rotulo={c.titulo}
                cor={c.cor}
                ativo={c.ativo}
                onPress={() => alternar(c)}
                rotuloAcessivel={`${c.titulo}: ${c.ativo ? "ligado" : "desligado"} nas matérias`}
                testID={`mat-filtro-${c.contest_id}`}
              />
            ))}
          </ScrollView>

          <View style={s.resumo}>
            <Texto variante="meta">
              {materias.length} {materias.length === 1 ? "matéria" : "matérias"} em {ativos.length}{" "}
              {ativos.length === 1 ? "concurso" : "concursos"}
            </Texto>
            {recalculando ? (
              <View style={s.recalc} accessibilityLiveRegion="polite">
                <ActivityIndicator size="small" color={cores.azul} />
                <Texto variante="pequeno" cor={cores.azul}>
                  Recalculando
                </Texto>
              </View>
            ) : null}
          </View>

          {materias.length ? (
            materias.map((m, i) => (
              <Animated.View
                key={m.subject_id}
                layout={LinearTransition.springify().damping(20)}
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(140)}
              >
                <Card
                  style={{ gap: 9 }}
                  accessibilityLabel={`${m.nome}: cai em ${m.concursos.length} de ${ativos.length}, ${m.questoesTotal} questões somadas`}
                >
                  <View style={s.linha}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      <Texto variante="monoForte" cor={cores.tx2} style={{ fontSize: 12, width: 20 }}>
                        {String(i + 1).padStart(2, "0")}
                      </Texto>
                      <Texto variante="h3" style={{ flex: 1 }}>
                        {m.nome}
                      </Texto>
                    </View>
                    <View style={s.bolinhas}>
                      {ativos.map((c) => {
                        const cai = m.concursos.includes(c.contest_id);
                        return (
                          <View key={c.contest_id} style={[s.bolinha, { backgroundColor: cai ? c.cor : cores.linha }]}>
                            <Texto maxFontSizeMultiplier={1} style={[s.bolinhaTexto, !cai && { color: cores.tx2 }]}>
                              {siglaBolinha(c.titulo)}
                            </Texto>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  <Barra fracao={m.questoesTotal / max} />
                  <Texto variante="meta" style={{ fontSize: 12.5 }}>
                    Cai em {m.concursos.length} de {ativos.length} ·{" "}
                    {m.questoesTotal ? `${m.questoesTotal} questões somadas` : "questões não informadas"}
                  </Texto>
                </Card>
              </Animated.View>
            ))
          ) : (
            <EstadoVazio
              compacto
              icone={BookOpen}
              titulo="Sem conteúdo programático ainda"
              texto="Os editais ligados ainda não trouxeram as matérias. Quando trouxerem, elas aparecem aqui."
            />
          )}
          <Texto variante="rotulo" cor={cores.tx2} centro style={{ fontSize: 10, marginTop: 4 }}>
            Confira sempre o conteúdo no edital oficial
          </Texto>
        </>
      )}
    </Tela>
  );
}

function Barra({ fracao }: { fracao: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.set(withTiming(Math.max(0.03, Math.min(1, fracao)), { duration: 520 }));
  }, [fracao, w]);
  const estilo = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={s.barra}>
      <Animated.View style={[s.barraCheia, estilo]} />
    </View>
  );
}

const s = StyleSheet.create({
  dica: { flexDirection: "row", gap: 10, backgroundColor: cores.marcaT, borderRadius: 16, padding: 14 },
  filtros: { gap: 8, paddingHorizontal: 16 },
  resumo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 22 },
  recalc: { flexDirection: "row", alignItems: "center", gap: 6 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  bolinhas: { flexDirection: "row", gap: 4 },
  bolinha: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bolinhaTexto: { fontFamily: fontes.monoNegrito, fontSize: 8.5, color: cores.branco, letterSpacing: -0.3 },
  barra: { height: 8, borderRadius: 4, backgroundColor: cores.linha, overflow: "hidden" },
  barraCheia: { height: "100%", borderRadius: 4, backgroundColor: cores.azul },
});
