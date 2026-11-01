// Concursos: os que você acompanha, explorar (busca e filtros) e radar de previstos (Aprovado).
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown, LinearTransition } from "react-native-reanimated";
import { ChevronRight, Compass, Lock, MessageSquareText, Radar, Search, SearchX, SlidersHorizontal } from "lucide-react-native";
import {
  AREA_LABEL,
  AREAS,
  DATE_TIPO_LABEL,
  ESCOLARIDADE_LABEL,
  ESCOLARIDADES,
  UFS,
  dataCurtaBR,
  temRecurso,
  type AcompanhandoItemDTO,
  type Area,
} from "@aviso/shared";
import type { FiltrosConcursos } from "@/api/api";
import { mensagemDeErro } from "@/api/cliente";
import { useAcompanhando, useChecklist, useConcursos } from "@/api/consultas";
import { Botao } from "@/componentes/Botao";
import { Card } from "@/componentes/Card";
import { Cabecalho } from "@/componentes/Cabecalho";
import { Campo } from "@/componentes/Campo";
import { CartaoConcurso } from "@/componentes/CartaoConcurso";
import { Chip } from "@/componentes/Chip";
import { Segmentado } from "@/componentes/Controles";
import { EsqueletoLista } from "@/componentes/Esqueleto";
import { EstadoErro, EstadoVazio } from "@/componentes/EstadoVazio";
import { Etiqueta, SeloAprovado } from "@/componentes/Etiqueta";
import { Folha } from "@/componentes/Folha";
import { ItemChecklist } from "@/componentes/ItemChecklist";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Trilha } from "@/componentes/Trilha";
import { Texto } from "@/componentes/Texto";
import { useSessao } from "@/contexto/Sessao";
import { useUpsell } from "@/contexto/Upsell";
import { contagemTexto, dataChave, etiquetaConcurso, hojeLocal } from "@/lib/formato";
import { cores, fontes } from "@/tema";

type Aba = "acompanhando" | "explorar" | "radar";

export default function Concursos() {
  const params = useLocalSearchParams<{ aba?: string }>();
  const { me } = useSessao();
  const acomp = useAcompanhando();
  const abaDoLink = params.aba === "explorar" || params.aba === "radar" || params.aba === "acompanhando" ? params.aba : null;
  const [aba, setAba] = useState<Aba>(abaDoLink ?? "acompanhando");
  // Outra tela mandou abrir uma aba (ex.: "Explorar concursos"): segue o link.
  const [linkVisto, setLinkVisto] = useState(abaDoLink);
  if (abaDoLink !== linkVisto) {
    setLinkVisto(abaDoLink);
    if (abaDoLink) setAba(abaDoLink);
  }

  const n = acomp.data?.length ?? me?.contagens.acompanhando ?? 0;
  const radarLiberado = !!me && temRecurso(me.acesso, "radar");

  return (
    <Tela areaSeguraBaixo={false} aoAtualizar={() => acomp.refetch()} testID="tela-concursos">
      <Cabecalho sobre={n ? `Acompanhando ${n}` : "Nenhum acompanhado ainda"} titulo="Concursos" />
      <Segmentado
        opcoes={[
          { valor: "acompanhando", rotulo: "Meus" },
          { valor: "explorar", rotulo: "Explorar" },
          {
            valor: "radar",
            rotulo: "Radar",
            selo: radarLiberado ? undefined : <Lock size={13} color={aba === "radar" ? cores.marca : cores.tx2} strokeWidth={2.6} />,
          },
        ]}
        valor={aba}
        aoMudar={setAba}
      />
      {aba === "acompanhando" ? <Acompanhando q={acomp} aoExplorar={() => setAba("explorar")} /> : null}
      {aba === "explorar" ? <Explorar /> : null}
      {aba === "radar" ? <RadarAba liberado={radarLiberado} /> : null}
    </Tela>
  );
}

// ---------- Meus (acompanhando) ----------

function Acompanhando({ q, aoExplorar }: { q: ReturnType<typeof useAcompanhando>; aoExplorar: () => void }) {
  if (q.isPending) return <EsqueletoLista quantos={2} linhas={5} />;
  if (q.isError) return <EstadoErro mensagem={mensagemDeErro(q.error)} aoTentar={() => void q.refetch()} />;
  if (!q.data.length) {
    return (
      <EstadoVazio
        icone={Compass}
        titulo="Você ainda não acompanha nenhum concurso"
        texto="Acompanhe para receber os prazos na agenda, o checklist e os avisos de errata."
        acao="Explorar concursos"
        aoAcao={aoExplorar}
      />
    );
  }
  return (
    <>
      {q.data.map((a, i) => (
        <Animated.View key={a.contest_id} entering={FadeInDown.delay(50 * i).duration(280)} layout={LinearTransition}>
          <CartaoAcompanhado a={a} />
        </Animated.View>
      ))}
    </>
  );
}

function CartaoAcompanhado({ a }: { a: AcompanhandoItemDTO }) {
  const { me } = useSessao();
  const { abrirUpsell } = useUpsell();
  const { marcar } = useChecklist(a.contest_id);
  const hoje = hojeLocal();
  const c = a.concurso;
  const et = etiquetaConcurso(c, hoje);
  const prova = a.datas
    .filter((d) => d.tipo === "prova")
    .map((d) => dataChave(d))
    .filter((d): d is string => !!d)
    .sort()[0];
  const feitos = a.checklist.filter((i) => i.feito).length;
  const itens = [...a.checklist].sort((x, y) => Number(x.feito) - Number(y.feito) || x.ordem - y.ordem).slice(0, 4);
  const resto = a.checklist.length - itens.length;
  const pergunte = !!me && temRecurso(me.acesso, "pergunte_edital");
  const abrir = () => router.push(`/concurso/${a.contest_id}`);

  return (
    <Card corTopo={a.cor} style={{ gap: 10 }} testID={`acomp-${c.slug}`}>
      <Pressionavel onPress={abrir} escala={0.99} style={{ gap: 8 }} accessibilityLabel={`Abrir ${c.titulo}`}>
        <View style={s.linhaTitulo}>
          <Texto variante="h3" style={{ flex: 1 }}>
            {c.titulo}
          </Texto>
          <ChevronRight size={20} color={cores.tx2} strokeWidth={2.4} />
        </View>
        <Etiqueta texto={et.texto} tom={et.tom} />
        <Trilha cor={a.cor} status={c.status} />
        <Texto variante="meta">
          {[prova ? `Prova em ${dataCurtaBR(prova)} (${contagemTexto(prova, hoje)})` : "Prova sem data", c.banca ?? "banca a definir"].join(
            " · ",
          )}
        </Texto>
        {c.proxima_data && c.proxima_data.tipo !== "prova" ? (
          <Texto variante="pequeno">
            Próximo prazo: {DATE_TIPO_LABEL[c.proxima_data.tipo].toLowerCase()} até {dataCurtaBR(c.proxima_data.data)}
          </Texto>
        ) : null}
      </Pressionavel>

      <View style={s.checklist}>
        <View style={s.linhaTitulo}>
          <Texto variante="rotulo" cor={cores.tx2}>
            Checklist
          </Texto>
          <Texto
            variante="monoForte"
            cor={feitos === a.checklist.length && feitos > 0 ? cores.verdeTexto : cores.tx2}
            style={{ fontSize: 12 }}
          >
            {feitos} de {a.checklist.length}
          </Texto>
        </View>
        <Animated.View layout={LinearTransition}>
          {itens.map((i) => (
            <Animated.View key={i.id} layout={LinearTransition.duration(220)}>
              <ItemChecklist item={i} cor={a.cor} aoMarcar={(feito) => marcar.mutate({ itemId: i.id, feito })} />
            </Animated.View>
          ))}
        </Animated.View>
        {resto > 0 ? (
          <Pressionavel onPress={abrir} style={{ minHeight: 36, justifyContent: "center" }}>
            <Texto variante="corpoForte" cor={cores.azul} style={{ fontSize: 13.5 }}>
              Ver os outros {resto} itens
            </Texto>
          </Pressionavel>
        ) : null}
      </View>

      <Botao
        titulo="Pergunte ao edital"
        icone={pergunte ? MessageSquareText : Lock}
        tamanho="p"
        variante={pergunte ? "primario" : "secundario"}
        onPress={() =>
          pergunte
            ? router.push(`/concurso/${a.contest_id}/pergunte`)
            : abrirUpsell("Pergunte ao edital responde suas dúvidas só com base no edital, citando item e página.")
        }
      />
    </Card>
  );
}

// ---------- Explorar ----------

const ORDENS: { valor: NonNullable<FiltrosConcursos["ordem"]>; rotulo: string }[] = [
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "prazo", rotulo: "Prazo mais perto" },
  { valor: "salario", rotulo: "Maior salário" },
  { valor: "vagas", rotulo: "Mais vagas" },
];

function useDebounce<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

function Explorar() {
  const [texto, setTexto] = useState("");
  const [abertos, setAbertos] = useState(false);
  const [uf, setUf] = useState<string | undefined>();
  const [escolaridade, setEscolaridade] = useState<string | undefined>();
  const [area, setArea] = useState<string | undefined>();
  const [ordem, setOrdem] = useState<NonNullable<FiltrosConcursos["ordem"]>>("recentes");
  const [folha, setFolha] = useState(false);
  const q = useDebounce(texto.trim());
  const filtros = useMemo(
    () => ({ q: q || undefined, abertos, uf, escolaridade, area, ordem }),
    [q, abertos, uf, escolaridade, area, ordem],
  );
  const r = useConcursos(filtros);
  const itens = r.data?.pages.flatMap((p) => p.itens) ?? [];
  const total = r.data?.pages[0]?.total ?? 0;
  const nFiltros = [uf, escolaridade, area].filter(Boolean).length + (ordem !== "recentes" ? 1 : 0);

  const limpar = () => {
    setUf(undefined);
    setEscolaridade(undefined);
    setArea(undefined);
    setOrdem("recentes");
  };

  return (
    <>
      <Campo
        icone={Search}
        value={texto}
        onChangeText={setTexto}
        placeholder="Órgão, cargo ou cidade"
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Buscar concursos"
        testID="busca-concursos"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={s.filtros}>
        <Chip
          rotulo={nFiltros ? `Filtros · ${nFiltros}` : "Filtros"}
          icone={SlidersHorizontal}
          ativo={nFiltros > 0}
          onPress={() => setFolha(true)}
          testID="abrir-filtros"
        />
        <Chip rotulo="Inscrições abertas" ativo={abertos} onPress={() => setAbertos((v) => !v)} />
        {uf ? <Chip rotulo={uf} ativo onPress={() => setUf(undefined)} rotuloAcessivel={`Remover filtro ${uf}`} /> : null}
        {escolaridade ? (
          <Chip
            rotulo={ESCOLARIDADE_LABEL[escolaridade as keyof typeof ESCOLARIDADE_LABEL]}
            ativo
            onPress={() => setEscolaridade(undefined)}
          />
        ) : null}
        {area ? <Chip rotulo={AREA_LABEL[area as Area]} ativo onPress={() => setArea(undefined)} /> : null}
      </ScrollView>

      <View style={s.contagem}>
        <Texto variante="meta">{r.isPending ? "Buscando…" : `${total} ${total === 1 ? "concurso" : "concursos"}`}</Texto>
        {r.isFetching && !r.isPending && !r.isFetchingNextPage ? <ActivityIndicator size="small" color={cores.azul} /> : null}
      </View>

      {r.isPending ? (
        <EsqueletoLista quantos={3} linhas={4} />
      ) : r.isError ? (
        <EstadoErro mensagem={mensagemDeErro(r.error)} aoTentar={() => void r.refetch()} />
      ) : itens.length ? (
        <>
          {itens.map((c, i) => (
            <Animated.View key={c.id} entering={FadeIn.delay(Math.min(i, 6) * 30).duration(220)}>
              <CartaoConcurso c={c} />
            </Animated.View>
          ))}
          {r.hasNextPage ? (
            <Botao
              titulo="Mostrar mais"
              variante="secundario"
              bloco
              carregando={r.isFetchingNextPage}
              onPress={() => void r.fetchNextPage()}
            />
          ) : null}
        </>
      ) : (
        <EstadoVazio
          compacto
          icone={SearchX}
          titulo="Nenhum concurso encontrado"
          texto="Tente outra palavra ou tire alguns filtros."
          acao={nFiltros || abertos ? "Limpar filtros" : undefined}
          aoAcao={() => {
            limpar();
            setAbertos(false);
          }}
        />
      )}

      <Folha
        visivel={folha}
        aoFechar={() => setFolha(false)}
        titulo="Filtros"
        rodape={
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Botao titulo="Limpar" variante="secundario" onPress={limpar} style={{ flex: 1 }} bloco />
            <Botao titulo="Ver resultados" onPress={() => setFolha(false)} style={{ flex: 2 }} bloco />
          </View>
        }
      >
        <GrupoFiltro titulo="Ordenar por">
          {ORDENS.map((o) => (
            <Chip key={o.valor} rotulo={o.rotulo} ativo={ordem === o.valor} onPress={() => setOrdem(o.valor)} />
          ))}
        </GrupoFiltro>
        <GrupoFiltro titulo="Escolaridade">
          {ESCOLARIDADES.map((e) => (
            <Chip
              key={e}
              rotulo={ESCOLARIDADE_LABEL[e]}
              ativo={escolaridade === e}
              onPress={() => setEscolaridade(escolaridade === e ? undefined : e)}
            />
          ))}
        </GrupoFiltro>
        <GrupoFiltro titulo="Área">
          {AREAS.map((a) => (
            <Chip
              key={a}
              rotulo={a === "ti" ? "TI" : AREA_LABEL[a]}
              ativo={area === a}
              onPress={() => setArea(area === a ? undefined : a)}
            />
          ))}
        </GrupoFiltro>
        <GrupoFiltro titulo="Estado (federais nacionais sempre entram)">
          {UFS.map((u) => (
            <Pressionavel
              key={u}
              onPress={() => setUf(uf === u ? undefined : u)}
              haptico="selecao"
              accessibilityRole="radio"
              accessibilityState={{ checked: uf === u }}
              accessibilityLabel={u}
              style={[s.uf, uf === u && s.ufAtivo]}
            >
              <Texto style={[s.ufTexto, uf === u && { color: cores.branco }]}>{u}</Texto>
            </Pressionavel>
          ))}
        </GrupoFiltro>
      </Folha>
    </>
  );
}

function GrupoFiltro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Texto variante="h3">{titulo}</Texto>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>
    </View>
  );
}

// ---------- Radar ----------

function RadarAba({ liberado }: { liberado: boolean }) {
  const { abrirUpsell } = useUpsell();
  const r = useConcursos({ radar: true, ordem: "recentes" }, liberado);
  const itens = r.data?.pages.flatMap((p) => p.itens) ?? [];

  if (!liberado) {
    return (
      <Card style={s.upsell}>
        <View style={s.upsellIcone}>
          <Radar size={28} color={cores.azul} strokeWidth={2.2} />
        </View>
        <SeloAprovado />
        <Texto variante="tituloMedio" centro>
          Radar de previstos e autorizados
        </Texto>
        <Texto variante="corpo" centro cor={cores.tx2}>
          Saiba dos concursos antes do edital: autorização em portaria, banca contratada e previsões oficiais. Dá tempo de começar a estudar
          antes de todo mundo.
        </Texto>
        <Botao
          titulo="Conhecer o Aprovado"
          variante="marca"
          onPress={() => abrirUpsell("O radar mostra concursos previstos e autorizados antes do edital sair.")}
          style={{ alignSelf: "center" }}
        />
      </Card>
    );
  }
  return (
    <>
      <View style={s.dica}>
        <Radar size={18} color={cores.azul} strokeWidth={2.4} />
        <Texto variante="corpo" style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>
          Previstos, autorizados e com banca definida. O edital ainda não saiu: acompanhe e a gente avisa quando sair.
        </Texto>
      </View>
      {r.isPending ? (
        <EsqueletoLista quantos={2} linhas={4} />
      ) : r.isError ? (
        <EstadoErro mensagem={mensagemDeErro(r.error)} aoTentar={() => void r.refetch()} />
      ) : itens.length ? (
        <>
          {itens.map((c) => (
            <CartaoConcurso key={c.id} c={c} />
          ))}
          {r.hasNextPage ? (
            <Botao
              titulo="Mostrar mais"
              variante="secundario"
              bloco
              carregando={r.isFetchingNextPage}
              onPress={() => void r.fetchNextPage()}
            />
          ) : null}
        </>
      ) : (
        <EstadoVazio
          compacto
          icone={Radar}
          titulo="Radar limpo por enquanto"
          texto="Quando sair autorização ou previsão oficial, aparece aqui."
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  linhaTitulo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  checklist: { borderTopWidth: 1, borderTopColor: cores.linha, paddingTop: 10, gap: 2 },
  filtros: { gap: 8, paddingHorizontal: 16 },
  contagem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 20 },
  uf: {
    width: "12.8%",
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
  },
  ufAtivo: { backgroundColor: cores.azul, borderColor: cores.azul },
  ufTexto: { fontFamily: fontes.monoNegrito, fontSize: 13.5, color: cores.tinta },
  upsell: { alignItems: "center", gap: 10, paddingVertical: 24 },
  upsellIcone: { width: 64, height: 64, borderRadius: 32, backgroundColor: cores.azulT, alignItems: "center", justifyContent: "center" },
  dica: { flexDirection: "row", gap: 10, backgroundColor: cores.azulT, borderRadius: 16, padding: 14, alignItems: "flex-start" },
});
