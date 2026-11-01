// Agenda: todos os concursos acompanhados numa agenda só, uma cor por concurso.
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { CalendarX2, ChevronLeft, ChevronRight, Compass } from "lucide-react-native";
import { somarDias, type CompromissoDTO } from "@aviso/shared";
import { useAcompanhando, useAgenda } from "@/api/consultas";
import { mensagemDeErro } from "@/api/cliente";
import { Cabecalho } from "@/componentes/Cabecalho";
import { Chip } from "@/componentes/Chip";
import { Segmentado } from "@/componentes/Controles";
import { EsqueletoLista } from "@/componentes/Esqueleto";
import { EstadoErro, EstadoVazio } from "@/componentes/EstadoVazio";
import { LinhaCompromisso } from "@/componentes/LinhaCompromisso";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import {
  dataChave,
  DIAS_SEMANA_LETRA,
  DIAS_SEMANA_LONGO,
  diaCurto,
  diaDaSemana,
  fimDoMes,
  hojeLocal,
  inicioDaSemana,
  inicioDoMes,
  MESES,
  mesAno,
  partes,
  somarMeses,
} from "@/lib/formato";
import { vibrar } from "@/lib/vibrar";
import { cores, fontes, TOQUE_MIN } from "@/tema";

type Modo = "semana" | "mes";
const LETRAS_SEG_DOM = [1, 2, 3, 4, 5, 6, 0].map((d) => DIAS_SEMANA_LETRA[d]);

export default function Agenda() {
  const dia = hojeLocal();
  const [modo, setModo] = useState<Modo>("semana");
  const [ancora, setAncora] = useState(dia);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [ocultos, setOcultos] = useState<string[]>([]);
  const acomp = useAcompanhando();

  // Semana: 7 dias corridos a partir da âncora (começa hoje). Mês: o mês da âncora.
  const inicio = modo === "semana" ? ancora : inicioDoMes(ancora);
  const fim = modo === "semana" ? somarDias(inicio, 6) : fimDoMes(ancora);
  const contemHoje = dia >= inicio && dia <= fim;
  const listaDe = contemHoje ? dia : inicio;
  const listaAte = modo === "semana" ? somarDias(listaDe, 45) : fim;
  const agenda = useAgenda(inicio, listaAte > fim ? listaAte : fim);

  const visiveis = useMemo(() => (agenda.data ?? []).filter((c) => !ocultos.includes(c.contest_id)), [agenda.data, ocultos]);

  /** Pontos coloridos por dia (data que importa de cada compromisso). */
  const pontos = useMemo(() => {
    const m = new Map<string, string[]>();
    const marcar = (d: string, cor: string) => {
      const l = m.get(d) ?? [];
      if (!l.includes(cor)) l.push(cor);
      m.set(d, l);
    };
    for (const c of visiveis) {
      const k = dataChave(c);
      if (k) marcar(k, c.cor);
      // Início de período (inscrições abrem) também marca o dia.
      if (c.inicio && c.fim && c.inicio !== c.fim) marcar(c.inicio, c.cor);
    }
    return m;
  }, [visiveis]);

  const grupos = useMemo(() => {
    const lista = visiveis.filter((c) => {
      const k = dataChave(c);
      if (!k) return false;
      if (selecionado) return k === selecionado;
      return k >= listaDe && k <= listaAte;
    });
    const g = new Map<string, CompromissoDTO[]>();
    for (const c of lista) {
      const k = dataChave(c)!;
      g.set(k, [...(g.get(k) ?? []), c]);
    }
    return [...g.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visiveis, selecionado, listaDe, listaAte]);

  const navegar = (dir: 1 | -1) => {
    vibrar.selecao();
    setSelecionado(null);
    setAncora(modo === "semana" ? somarDias(inicio, dir * 7) : somarMeses(inicio, dir));
  };

  const irParaHoje = () => {
    setAncora(dia);
    setSelecionado(null);
  };

  const alternarConcurso = (id: string) => setOcultos((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const rotuloPeriodo =
    modo === "semana"
      ? (() => {
          const a = partes(inicio);
          const b = partes(fim);
          return a.mes === b.mes
            ? `${a.dia} a ${b.dia} de ${MESES[a.mes - 1]}`
            : `${a.dia}/${String(a.mes).padStart(2, "0")} a ${b.dia}/${String(b.mes).padStart(2, "0")}`;
        })()
      : mesAno(inicio);

  const semConcursos = acomp.data && acomp.data.length === 0;

  return (
    <Tela areaSeguraBaixo={false} aoAtualizar={() => Promise.all([agenda.refetch(), acomp.refetch()])} testID="tela-agenda">
      <Cabecalho
        sobre={mesAno(selecionado ?? (contemHoje ? dia : inicio))}
        titulo="Agenda"
        direita={
          !contemHoje || selecionado ? (
            <Pressionavel onPress={irParaHoje} style={s.hoje} accessibilityLabel="Voltar para hoje">
              <Texto variante="corpoForte" cor={cores.azul} style={{ fontSize: 14 }}>
                Hoje
              </Texto>
            </Pressionavel>
          ) : null
        }
      />

      {semConcursos ? (
        <EstadoVazio
          icone={Compass}
          titulo="Sua agenda está vazia"
          texto="Acompanhe concursos e as datas de isenção, inscrição, boleto e prova aparecem aqui, cada um com sua cor."
          acao="Explorar concursos"
          aoAcao={() => router.navigate("/concursos?aba=explorar")}
        />
      ) : (
        <>
          {acomp.data?.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={s.filtros}
              accessibilityLabel="Concursos na agenda"
            >
              {acomp.data.map((a) => (
                <Chip
                  key={a.contest_id}
                  modo="filtro"
                  rotulo={a.concurso.orgao_sigla ?? a.concurso.orgao}
                  cor={a.cor}
                  ativo={!ocultos.includes(a.contest_id)}
                  onPress={() => alternarConcurso(a.contest_id)}
                  rotuloAcessivel={`${a.concurso.orgao_sigla ?? a.concurso.orgao}: ${ocultos.includes(a.contest_id) ? "escondido" : "aparecendo"} na agenda`}
                  testID={`filtro-${a.concurso.slug}`}
                />
              ))}
            </ScrollView>
          ) : null}

          <Segmentado
            opcoes={[
              { valor: "semana", rotulo: "Semana" },
              { valor: "mes", rotulo: "Mês" },
            ]}
            valor={modo}
            aoMudar={(m) => {
              setModo(m);
              setSelecionado(null);
              const base = selecionado ?? (contemHoje ? dia : inicio);
              setAncora(m === "semana" ? (base.slice(0, 7) === dia.slice(0, 7) ? dia : base) : base);
            }}
          />

          <View style={s.nav}>
            <Pressionavel
              onPress={() => navegar(-1)}
              style={s.seta}
              accessibilityLabel={modo === "semana" ? "Semana anterior" : "Mês anterior"}
              haptico="nenhum"
            >
              <ChevronLeft size={22} color={cores.tinta} strokeWidth={2.4} />
            </Pressionavel>
            <Texto variante="corpoForte" accessibilityLiveRegion="polite">
              {rotuloPeriodo}
            </Texto>
            <Pressionavel
              onPress={() => navegar(1)}
              style={s.seta}
              accessibilityLabel={modo === "semana" ? "Próxima semana" : "Próximo mês"}
              haptico="nenhum"
            >
              <ChevronRight size={22} color={cores.tinta} strokeWidth={2.4} />
            </Pressionavel>
          </View>

          {modo === "semana" ? (
            <Semana inicio={inicio} hoje={dia} selecionado={selecionado} pontos={pontos} aoEscolher={setSelecionado} />
          ) : (
            <Mes inicio={inicio} hoje={dia} selecionado={selecionado} pontos={pontos} aoEscolher={setSelecionado} />
          )}

          <View style={s.tituloLista}>
            <Texto variante="h2" accessibilityRole="header">
              {selecionado ? `Em ${diaCurto(selecionado)}` : contemHoje ? "Próximos compromissos" : "Compromissos do período"}
            </Texto>
            {selecionado ? (
              <Pressionavel onPress={() => setSelecionado(null)} style={s.hoje} accessibilityLabel="Ver todos os compromissos">
                <Texto variante="corpoForte" cor={cores.azul} style={{ fontSize: 13.5 }}>
                  Ver todos
                </Texto>
              </Pressionavel>
            ) : null}
          </View>

          {agenda.isPending ? (
            <EsqueletoLista quantos={3} linhas={2} />
          ) : agenda.isError ? (
            <EstadoErro mensagem={mensagemDeErro(agenda.error)} aoTentar={() => void agenda.refetch()} />
          ) : grupos.length ? (
            grupos.map(([data, itens]) => (
              <Animated.View
                key={data}
                layout={LinearTransition.duration(220)}
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(150)}
                style={{ gap: 8 }}
              >
                {!selecionado ? (
                  <View style={s.cabecaDia}>
                    <Texto variante="rotulo" cor={data === dia ? cores.azul : cores.tx2}>
                      {data === dia ? "hoje" : DIAS_SEMANA_LONGO[diaDaSemana(data)]} · {data.slice(8, 10)}/{data.slice(5, 7)}
                    </Texto>
                    <View style={s.cabecaLinha} />
                  </View>
                ) : null}
                {itens.map((c) => (
                  <LinhaCompromisso key={c.id} c={c} hoje={dia} />
                ))}
              </Animated.View>
            ))
          ) : (
            <EstadoVazio
              compacto
              icone={CalendarX2}
              titulo={selecionado ? "Nada marcado neste dia" : "Nada marcado neste período"}
              texto={
                ocultos.length
                  ? "Alguns concursos estão escondidos pelos filtros acima."
                  : "Quando sair data nova (ou errata), ela entra aqui sozinha."
              }
            />
          )}
        </>
      )}
    </Tela>
  );
}

function Pontos({ cores: lista, claro }: { cores: string[] | undefined; claro?: boolean }) {
  return (
    <View style={s.pontos}>
      {(lista ?? []).slice(0, 3).map((c) => (
        <View key={c} style={[s.ponto, { backgroundColor: c }, claro && { borderWidth: 1, borderColor: cores.branco }]} />
      ))}
    </View>
  );
}

type PropsCal = {
  inicio: string;
  hoje: string;
  selecionado: string | null;
  pontos: Map<string, string[]>;
  aoEscolher: (d: string | null) => void;
};

function Semana({ inicio, hoje, selecionado, pontos, aoEscolher }: PropsCal) {
  return (
    <View style={s.semana} accessibilityRole="list">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = somarDias(inicio, i);
        const ativo = d === selecionado;
        const ehHoje = d === hoje;
        const n = pontos.get(d)?.length ?? 0;
        return (
          <Pressionavel
            key={d}
            onPress={() => aoEscolher(ativo ? null : d)}
            haptico="selecao"
            escala={0.94}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`${diaCurto(d)}${ehHoje ? ", hoje" : ""}${n ? `, ${n} ${n === 1 ? "compromisso" : "compromissos"}` : ""}`}
            style={[s.dia, ehHoje && s.diaHoje, ativo && s.diaAtivo]}
            testID={`dia-${d}`}
          >
            <Texto style={[s.diaLetra, ativo && { color: cores.azulSuave }]} maxFontSizeMultiplier={1.2}>
              {DIAS_SEMANA_LETRA[diaDaSemana(d)]}
            </Texto>
            <Texto
              style={[s.diaNum, ativo && { color: cores.branco }, ehHoje && !ativo && { color: cores.azul }]}
              maxFontSizeMultiplier={1.2}
            >
              {partes(d).dia}
            </Texto>
            <Pontos cores={pontos.get(d)} claro={ativo} />
          </Pressionavel>
        );
      })}
    </View>
  );
}

function Mes({ inicio, hoje, selecionado, pontos, aoEscolher }: PropsCal) {
  const primeiro = inicioDaSemana(inicio);
  const ultimoDia = fimDoMes(inicio);
  const semanas: string[][] = [];
  for (let d = primeiro; d <= ultimoDia; d = somarDias(d, 7)) {
    semanas.push(Array.from({ length: 7 }).map((_, i) => somarDias(d, i)));
  }
  const mes = inicio.slice(0, 7);
  return (
    <View style={s.mes}>
      <View style={s.mesLinha}>
        {LETRAS_SEG_DOM.map((l, i) => (
          <Texto key={i} style={s.mesLetra} maxFontSizeMultiplier={1.2}>
            {l}
          </Texto>
        ))}
      </View>
      {semanas.map((linha) => (
        <View key={linha[0]} style={s.mesLinha}>
          {linha.map((dd) => {
            const fora = dd.slice(0, 7) !== mes;
            const ativo = dd === selecionado;
            const ehHoje = dd === hoje;
            return (
              <Pressionavel
                key={dd}
                onPress={() => aoEscolher(ativo ? null : dd)}
                haptico="selecao"
                escala={0.9}
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={`${diaCurto(dd)}${pontos.get(dd)?.length ? `, ${pontos.get(dd)!.length} compromissos` : ""}`}
                style={[s.mesCelula, ehHoje && s.mesHoje, ativo && s.diaAtivo]}
              >
                <Texto
                  style={[
                    s.mesNum,
                    fora && { color: cores.tx3 },
                    ehHoje && !ativo && { color: cores.azul },
                    ativo && { color: cores.branco },
                  ]}
                  maxFontSizeMultiplier={1.2}
                >
                  {partes(dd).dia}
                </Texto>
                <Pontos cores={pontos.get(dd)} claro={ativo} />
              </Pressionavel>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  hoje: { minHeight: TOQUE_MIN, justifyContent: "center", paddingHorizontal: 8 },
  filtros: { gap: 8, paddingHorizontal: 16 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: -4 },
  seta: { width: TOQUE_MIN, height: TOQUE_MIN, borderRadius: TOQUE_MIN / 2, alignItems: "center", justifyContent: "center" },
  semana: { flexDirection: "row", gap: 6 },
  dia: {
    flex: 1,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
    minHeight: 66,
  },
  diaHoje: { borderColor: cores.azul, borderWidth: 1.5 },
  diaAtivo: { backgroundColor: cores.tinta, borderColor: cores.tinta },
  diaLetra: { fontFamily: fontes.medio, fontSize: 11, color: cores.tx2 },
  diaNum: { fontFamily: fontes.monoNegrito, fontSize: 15, color: cores.tinta },
  pontos: { flexDirection: "row", gap: 3, minHeight: 6, alignItems: "center" },
  ponto: { width: 6, height: 6, borderRadius: 3 },
  tituloLista: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  cabecaDia: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 4, marginTop: 4 },
  cabecaLinha: { flex: 1, height: 1, backgroundColor: cores.linha },
  mes: { backgroundColor: cores.branco, borderRadius: 20, borderWidth: 1, borderColor: cores.linha, padding: 8, gap: 2 },
  mesLinha: { flexDirection: "row" },
  mesLetra: { flex: 1, textAlign: "center", fontFamily: fontes.medio, fontSize: 11, color: cores.tx2, paddingVertical: 4 },
  mesCelula: { flex: 1, minHeight: TOQUE_MIN + 2, alignItems: "center", justifyContent: "center", borderRadius: 12, gap: 2 },
  mesHoje: { borderWidth: 1.5, borderColor: cores.azul },
  mesNum: { fontFamily: fontes.monoNegrito, fontSize: 14, color: cores.tinta },
});
