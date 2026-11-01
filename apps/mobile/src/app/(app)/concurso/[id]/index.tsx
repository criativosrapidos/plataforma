// Detalhe do concurso: trilha, resumo, vagas, salário, taxa, cargos, cronograma, matérias,
// o que mudou (errata), checklist, link oficial, acompanhar e Pergunte ao edital.
import { useEffect, useState } from "react";
import { Platform, Share, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown, LinearTransition } from "react-native-reanimated";
import { ArrowRight, Check, ExternalLink, FileSearch, Lock, MessageSquareText, Plus, Share2 } from "lucide-react-native";
import {
  brl,
  CONTEST_COLORS,
  DATE_TIPO_LABEL,
  ESCOLARIDADE_LABEL,
  numeroBR,
  periodoBR,
  temRecurso,
  type ConcursoDetalheDTO,
  type DataDTO,
} from "@aviso/shared";
import { mensagemDeErro } from "@/api/cliente";
import { ehParcial, useAtualizarAcompanhamento, useChecklist, useConcurso } from "@/api/consultas";
import { useAcoesConcurso } from "@/componentes/acoesConcurso";
import { Botao } from "@/componentes/Botao";
import { BarraVoltar, BotaoRedondo, Secao } from "@/componentes/Cabecalho";
import { Campo } from "@/componentes/Campo";
import { Card } from "@/componentes/Card";
import { localConcurso, nomeCurto } from "@/componentes/CartaoConcurso";
import { Esqueleto, EsqueletoLista } from "@/componentes/Esqueleto";
import { EstadoErro } from "@/componentes/EstadoVazio";
import { Etiqueta, SeloAprovado } from "@/componentes/Etiqueta";
import { ItemChecklist } from "@/componentes/ItemChecklist";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useToast } from "@/componentes/Toast";
import { Trilha } from "@/componentes/Trilha";
import { useSessao } from "@/contexto/Sessao";
import { useUpsell } from "@/contexto/Upsell";
import { contagemTexto, dataChave, diasAte, etiquetaConcurso, hojeLocal, quando, rotuloCampo, valorCampo } from "@/lib/formato";
import { abrirLink } from "@/lib/links";
import { vibrar } from "@/lib/vibrar";
import { cores, fontes, TOQUE_MIN } from "@/tema";

export default function DetalheConcurso() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useConcurso(id);
  const c = q.data;

  // Link com slug: troca para o id para o cache das ações bater.
  useEffect(() => {
    if (c && !ehParcial(c) && c.id !== id) router.setParams({ id: c.id });
  }, [c, id]);

  const compartilhar = async () => {
    if (!c) return;
    try {
      await Share.share({ message: `${c.titulo}\nLink oficial: ${c.url_oficial}`, url: Platform.OS === "ios" ? c.url_oficial : undefined });
    } catch {
      /* cancelado */
    }
  };

  return (
    <Tela
      topo={
        <View style={{ paddingHorizontal: 16 }}>
          <BarraVoltar
            direita={
              c ? (
                <BotaoRedondo rotulo="Compartilhar" onPress={compartilhar}>
                  <Share2 size={20} color={cores.tinta} strokeWidth={2.2} />
                </BotaoRedondo>
              ) : null
            }
          />
        </View>
      }
      aoAtualizar={() => q.refetch()}
      testID="tela-concurso"
    >
      {q.isPending ? (
        <View style={{ gap: 12 }}>
          <Esqueleto largura={120} altura={20} arredondado={999} />
          <Esqueleto largura="90%" altura={30} />
          <Esqueleto largura="60%" altura={30} />
          <EsqueletoLista quantos={2} />
        </View>
      ) : q.isError && !c ? (
        <EstadoErro mensagem={mensagemDeErro(q.error)} aoTentar={() => void q.refetch()} />
      ) : c ? (
        <Conteudo c={c} parcial={ehParcial(c)} />
      ) : null}
    </Tela>
  );
}

function Conteudo({ c, parcial }: { c: ConcursoDetalheDTO; parcial: boolean }) {
  const { me } = useSessao();
  const { abrirUpsell } = useUpsell();
  const { acompanhar, deixar } = useAcoesConcurso();
  const atualizar = useAtualizarAcompanhamento();
  const toast = useToast();
  const hoje = hojeLocal();
  const et = etiquetaConcurso(c, hoje);
  const acomp = c.acompanhamento;
  const cor = acomp?.cor ?? cores.azul;
  const pergunte = !!me && temRecurso(me.acesso, "pergunte_edital");
  const datas = [...c.datas].sort((a, b) => (dataChave(a) ?? "").localeCompare(dataChave(b) ?? ""));

  const mudarAcomp = (dados: { cor?: string; role_id?: string | null }) => {
    vibrar.selecao();
    atualizar.mutate({ contestId: c.id, dados }, { onError: (e) => toast.mostrar(mensagemDeErro(e), "erro") });
  };

  return (
    <>
      <Animated.View entering={FadeIn.duration(220)} style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          <Etiqueta texto={et.texto} tom={et.tom} />
          {c.exemplo ? <Etiqueta texto="Dados de exemplo" tom="neutro" /> : null}
        </View>
        <Texto variante="tituloMedio" style={{ fontSize: 30, lineHeight: 31 }} accessibilityRole="header">
          {c.titulo}
        </Texto>
        <Texto variante="meta" style={{ fontSize: 14 }}>
          {c.orgao} · {localConcurso(c)}
          {c.numero_edital ? ` · Edital ${c.numero_edital}` : ""}
        </Texto>
      </Animated.View>

      <Trilha status={c.status} cor={cor} comRotulos />

      <View style={s.fatos}>
        <Fato
          rotulo="Vagas"
          valor={
            c.vagas_total
              ? `${numeroBR(c.vagas_total)}${c.cadastro_reserva ? " + CR" : ""}`
              : c.cadastro_reserva
                ? "Cadastro reserva"
                : "A definir"
          }
        />
        <Fato rotulo="Salário até" valor={c.salario_max_centavos ? brl(c.salario_max_centavos) : "A definir"} />
        <Fato rotulo="Taxa" valor={parcial ? "…" : c.taxa_centavos ? brl(c.taxa_centavos) : "A definir"} />
        <Fato rotulo="Banca" valor={c.banca ?? "A definir"} />
      </View>

      <Botao
        titulo="Abrir link oficial"
        icone={ExternalLink}
        tamanho="g"
        bloco
        onPress={() => void abrirLink(c.url_oficial)}
        testID="link-oficial"
      />

      {acomp ? (
        <Card style={{ gap: 12 }}>
          <View style={s.linha}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[s.corPonto, { backgroundColor: cor }]} />
              <Texto variante="h3">Você acompanha</Texto>
            </View>
            <Pressionavel
              onPress={() => deixar(c.id, nomeCurto(c))}
              style={s.deixar}
              accessibilityLabel="Deixar de acompanhar"
              testID="deixar-acompanhar"
            >
              <Texto variante="corpoForte" cor={cores.vermTexto} style={{ fontSize: 13.5 }}>
                Deixar de acompanhar
              </Texto>
            </Pressionavel>
          </View>
          <Texto variante="pequeno">Cor na agenda e nas matérias</Texto>
          <View style={s.cores} accessibilityRole="radiogroup">
            {CONTEST_COLORS.map((k) => (
              <Pressionavel
                key={k}
                onPress={() => mudarAcomp({ cor: k })}
                haptico="nenhum"
                escala={0.88}
                hitSlop={4}
                accessibilityRole="radio"
                accessibilityState={{ checked: k === cor }}
                accessibilityLabel={`Cor ${CONTEST_COLORS.indexOf(k) + 1}`}
                style={[s.cor, { backgroundColor: k }, k === cor && s.corAtiva]}
              >
                {k === cor ? <Check size={16} color={cores.branco} strokeWidth={3.2} /> : null}
              </Pressionavel>
            ))}
          </View>
        </Card>
      ) : (
        <View style={s.convite}>
          <Botao
            titulo="Acompanhar este concurso"
            icone={Plus}
            variante="marca"
            tamanho="g"
            bloco
            onPress={() => acompanhar(c.id, nomeCurto(c))}
            testID="acompanhar"
          />
          <Texto variante="pequeno" centro>
            Os prazos vão para a sua agenda, com checklist e aviso de errata.
          </Texto>
        </View>
      )}

      {c.resumo ? (
        <Texto variante="corpo" style={{ fontSize: 15 }}>
          {c.resumo}
        </Texto>
      ) : null}

      <Card
        style={s.pergunte}
        onPress={() =>
          pergunte
            ? c.tem_edital_texto
              ? router.push(`/concurso/${c.id}/pergunte`)
              : toast.mostrar("O texto deste edital ainda não está disponível para perguntas.", "info")
            : abrirUpsell("Pergunte ao edital responde suas dúvidas só com base no edital, citando item e página.")
        }
        testID="abrir-pergunte"
      >
        <View style={s.pergunteIcone}>
          {pergunte ? (
            <MessageSquareText size={22} color={cores.branco} strokeWidth={2.3} />
          ) : (
            <Lock size={20} color={cores.branco} strokeWidth={2.4} />
          )}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Texto variante="h3">Pergunte ao edital</Texto>
            <SeloAprovado />
          </View>
          <Texto variante="meta">
            {pergunte && !parcial && !c.tem_edital_texto
              ? "O texto deste edital ainda não chegou. Assim que chegar, você pergunta aqui."
              : "Isenção, requisitos, documentos, prova. A resposta vem só do edital, com item e página."}
          </Texto>
        </View>
        <ArrowRight size={20} color={cores.tx2} />
      </Card>

      {acomp ? <Checklist c={c} cor={cor} /> : null}

      <Secao titulo="Cronograma" />
      {parcial ? (
        <EsqueletoLista quantos={1} linhas={4} />
      ) : datas.length ? (
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          {datas.map((d, i) => (
            <LinhaData key={d.id} d={d} hoje={hoje} cor={cor} ultima={i === datas.length - 1} />
          ))}
        </Card>
      ) : (
        <Texto variante="meta">O cronograma ainda não foi publicado. Quando sair, entra na sua agenda.</Texto>
      )}

      {!parcial && c.cargos.length ? (
        <>
          <Secao titulo={acomp ? "Cargo de interesse" : "Cargos"} />
          {acomp ? (
            <Texto variante="pequeno" style={{ marginTop: -8 }}>
              Escolha o seu: as matérias passam a ser as do cargo.
            </Texto>
          ) : null}
          {c.cargos.map((r) => {
            const escolhido = acomp?.role_id === r.id;
            const corpo = (
              <>
                <View style={s.linha}>
                  <Texto variante="h3" style={{ flex: 1 }}>
                    {r.nome}
                  </Texto>
                  {acomp ? (
                    <View style={[s.radio, escolhido && { borderColor: cor }]}>
                      {escolhido ? <View style={[s.radioPonto, { backgroundColor: cor }]} /> : null}
                    </View>
                  ) : null}
                </View>
                <Texto variante="mono" cor={cores.tx2} style={{ fontSize: 12.5 }}>
                  {[
                    r.escolaridade ? ESCOLARIDADE_LABEL[r.escolaridade] : null,
                    r.vagas
                      ? `${numeroBR(r.vagas)} vagas${r.cadastro_reserva ? " + CR" : ""}`
                      : r.cadastro_reserva
                        ? "cadastro reserva"
                        : null,
                    r.salario_centavos ? brl(r.salario_centavos) : null,
                    r.jornada,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Texto>
                {r.requisitos ? <Texto variante="meta">{r.requisitos}</Texto> : null}
              </>
            );
            return acomp ? (
              <Card
                key={r.id}
                onPress={() => mudarAcomp({ role_id: escolhido ? null : r.id })}
                style={[{ gap: 4 }, escolhido && { borderColor: cor, borderWidth: 2 }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: escolhido }}
                rotuloAcessivel={`Cargo ${r.nome}${escolhido ? ", escolhido" : ""}`}
              >
                {corpo}
              </Card>
            ) : (
              <Card key={r.id} style={{ gap: 4 }}>
                {corpo}
              </Card>
            );
          })}
        </>
      ) : null}

      {!parcial && c.materias.length ? (
        <>
          <Secao titulo="Matérias" />
          <Card style={{ gap: 10 }}>
            {(() => {
              const lista = acomp?.role_id
                ? c.materias.filter((m) => !m.role_id || m.role_id === acomp.role_id)
                : c.materias.filter((m, i, l) => l.findIndex((x) => x.subject_id === m.subject_id) === i);
              const max = Math.max(1, ...lista.map((m) => m.questoes ?? 0));
              return lista.map((m) => (
                <View key={`${m.subject_id}-${m.role_id ?? "g"}`} style={{ gap: 5 }}>
                  <View style={s.linha}>
                    <Texto variante="corpoForte" style={{ flex: 1, fontSize: 14.5 }}>
                      {m.nome}
                    </Texto>
                    <Texto variante="monoForte" cor={cores.tx2} style={{ fontSize: 12 }}>
                      {m.questoes ? `${m.questoes} questões` : "—"}
                    </Texto>
                  </View>
                  <View style={s.barra}>
                    <View style={[s.barraCheia, { width: `${Math.max(4, ((m.questoes ?? 0) / max) * 100)}%`, backgroundColor: cor }]} />
                  </View>
                </View>
              ));
            })()}
          </Card>
        </>
      ) : null}

      {!parcial && c.versoes.length ? (
        <>
          <Secao titulo="O que mudou" />
          {c.versoes.map((v) => (
            <Animated.View key={v.versao} entering={FadeInDown.duration(240)}>
              <Card style={{ gap: 10 }}>
                <View style={s.linha}>
                  <Etiqueta texto="Errata" tom="errata" />
                  <Texto variante="mono" cor={cores.tx2} style={{ fontSize: 11.5 }}>
                    versão {v.versao} · {quando(v.created_at)}
                  </Texto>
                </View>
                {v.resumo ? <Texto variante="h3">{v.resumo}</Texto> : null}
                {v.diff.map((d, i) => (
                  <View
                    key={i}
                    style={s.diff}
                    accessible
                    accessibilityLabel={`${rotuloCampo(d.campo)}: antes ${valorCampo(d.campo, d.antes)}, agora ${valorCampo(d.campo, d.depois)}`}
                  >
                    <Texto variante="rotulo" cor={cores.tx2}>
                      {rotuloCampo(d.campo)}
                    </Texto>
                    <View style={s.diffLinha}>
                      <Texto variante="mono" cor={cores.vermTexto} style={s.antes}>
                        {valorCampo(d.campo, d.antes)}
                      </Texto>
                      <ArrowRight size={16} color={cores.tx2} strokeWidth={2.4} />
                      <Texto variante="monoForte" cor={cores.verdeTexto} style={s.depois}>
                        {valorCampo(d.campo, d.depois)}
                      </Texto>
                    </View>
                  </View>
                ))}
                {acomp ? (
                  <Texto variante="pequeno" cor={cores.verdeTexto}>
                    Sua agenda já está com as datas novas.
                  </Texto>
                ) : null}
              </Card>
            </Animated.View>
          ))}
        </>
      ) : null}

      <View style={s.fonte}>
        <FileSearch size={16} color={cores.tx2} />
        <Texto variante="pequeno" style={{ flex: 1 }}>
          Informações extraídas do edital publicado. Confira sempre o documento oficial antes de pagar ou se inscrever.
        </Texto>
      </View>
    </>
  );
}

function Fato({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={s.fato} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Texto variante="rotulo" cor={cores.tx2} style={{ fontSize: 10 }}>
        {rotulo}
      </Texto>
      <Texto variante="monoForte" style={{ fontSize: 14.5, lineHeight: 20 }} numberOfLines={2}>
        {valor}
      </Texto>
    </View>
  );
}

function LinhaData({ d, hoje, cor, ultima }: { d: DataDTO; hoje: string; cor: string; ultima: boolean }) {
  const k = dataChave(d);
  const faltam = k ? diasAte(k, hoje) : null;
  const passou = faltam !== null && faltam < 0;
  const fonte = [d.fonte_item ? `item ${d.fonte_item}` : null, d.fonte_pagina ? `p. ${d.fonte_pagina}` : null].filter(Boolean).join(" · ");
  return (
    <View
      style={s.data}
      accessible
      accessibilityLabel={`${DATE_TIPO_LABEL[d.tipo]}: ${periodoBR(d.inicio, d.fim)}${k ? `, ${contagemTexto(k, hoje)}` : ""}`}
    >
      <View style={{ alignItems: "center", width: 16 }}>
        <View style={[s.dataPonto, { backgroundColor: passou ? cores.linhaForte : cor }]} />
        {!ultima ? <View style={s.dataLinha} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2, paddingBottom: ultima ? 6 : 14 }}>
        <View style={s.linha}>
          <Texto variante="h3" cor={passou ? cores.tx2 : cores.tinta}>
            {DATE_TIPO_LABEL[d.tipo]}
          </Texto>
          {k ? (
            <Texto
              variante="monoForte"
              style={{ fontSize: 12 }}
              cor={passou ? cores.tx2 : faltam !== null && faltam <= 3 ? cores.vermTexto : cores.azul}
            >
              {d.inicio && d.fim && d.inicio !== d.fim && diasAte(d.inicio, hoje) <= 0 && !passou ? "aberto agora" : contagemTexto(k, hoje)}
            </Texto>
          ) : null}
        </View>
        <Texto variante="mono" cor={cores.tx2} style={{ fontSize: 13 }}>
          {periodoBR(d.inicio, d.fim)}
          {d.descricao ? ` · ${d.descricao}` : ""}
        </Texto>
        {fonte ? (
          <Texto variante="mono" cor={cores.tx3} style={{ fontSize: 11 }}>
            Edital: {fonte}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

function Checklist({ c, cor }: { c: ConcursoDetalheDTO; cor: string }) {
  const { marcar, adicionar, remover } = useChecklist(c.id);
  const toast = useToast();
  const [texto, setTexto] = useState("");
  const itens = c.acompanhamento?.checklist ?? [];
  const feitos = itens.filter((i) => i.feito).length;
  const pct = itens.length ? feitos / itens.length : 0;

  const add = () => {
    const t = texto.trim();
    if (!t) return;
    vibrar.toque();
    adicionar.mutate(t, { onError: (e) => toast.mostrar(mensagemDeErro(e), "erro") });
    setTexto("");
  };

  return (
    <>
      <Secao titulo="Checklist" />
      <Card style={{ gap: 6 }} testID="checklist">
        <View style={s.linha}>
          <Texto variante="meta">
            {feitos === itens.length && itens.length ? "Tudo pronto. Boa prova!" : `${feitos} de ${itens.length} feitos`}
          </Texto>
          <Texto variante="monoForte" cor={cores.tx2} style={{ fontSize: 12 }}>
            {Math.round(pct * 100)}%
          </Texto>
        </View>
        <View style={s.barra}>
          <View style={[s.barraCheia, { width: `${pct * 100}%`, backgroundColor: cores.verde }]} />
        </View>
        <Animated.View layout={LinearTransition} style={{ marginTop: 4 }}>
          {itens.map((i) => (
            <Animated.View key={i.id} layout={LinearTransition.duration(200)} entering={FadeIn.duration(200)}>
              <ItemChecklist
                item={i}
                cor={cor}
                aoMarcar={(feito) => marcar.mutate({ itemId: i.id, feito }, { onError: (e) => toast.mostrar(mensagemDeErro(e), "erro") })}
                aoRemover={
                  i.id.startsWith("temp-")
                    ? undefined
                    : () => {
                        vibrar.forte();
                        remover.mutate(i.id, {
                          onSuccess: () =>
                            toast.mostrar("Item removido.", "info", { rotulo: "Desfazer", aoPressionar: () => adicionar.mutate(i.texto) }),
                          onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
                        });
                      }
                }
              />
            </Animated.View>
          ))}
        </Animated.View>
        <View style={s.adicionar}>
          <View style={{ flex: 1 }}>
            <Campo
              value={texto}
              onChangeText={setTexto}
              placeholder="Adicionar item"
              onSubmitEditing={add}
              returnKeyType="done"
              blurOnSubmit={false}
              maxLength={140}
              testID="novo-item"
            />
          </View>
          <Pressionavel
            onPress={add}
            disabled={!texto.trim()}
            accessibilityLabel="Adicionar item ao checklist"
            style={[s.mais, !texto.trim() && { opacity: 0.4 }]}
          >
            <Plus size={22} color={cores.branco} strokeWidth={2.6} />
          </Pressionavel>
        </View>
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  fatos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fato: {
    flexGrow: 1,
    flexBasis: "46%",
    backgroundColor: cores.branco,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 12,
    gap: 4,
  },
  convite: { gap: 8 },
  corPonto: { width: 12, height: 12, borderRadius: 6 },
  deixar: { minHeight: TOQUE_MIN, justifyContent: "center" },
  cores: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cor: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  corAtiva: {
    borderWidth: 3,
    borderColor: cores.branco,
    outlineColor: cores.tinta,
    outlineWidth: 2,
    outlineStyle: "solid",
    transform: [{ scale: 1.08 }],
  },
  pergunte: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: cores.azulT, borderColor: cores.azulSuave },
  pergunteIcone: { width: 44, height: 44, borderRadius: 14, backgroundColor: cores.azul, alignItems: "center", justifyContent: "center" },
  data: { flexDirection: "row", gap: 12, paddingTop: 8 },
  dataPonto: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  dataLinha: { flex: 1, width: 2, backgroundColor: cores.linha, marginTop: 4 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: cores.linhaForte,
    alignItems: "center",
    justifyContent: "center",
  },
  radioPonto: { width: 10, height: 10, borderRadius: 5 },
  barra: { height: 8, borderRadius: 4, backgroundColor: cores.linha, overflow: "hidden" },
  barraCheia: { height: "100%", borderRadius: 4 },
  diff: { gap: 4, backgroundColor: cores.papel, borderRadius: 12, padding: 10 },
  diffLinha: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  antes: { textDecorationLine: "line-through", fontSize: 13.5 },
  depois: { fontSize: 14.5, fontFamily: fontes.monoNegrito },
  adicionar: { flexDirection: "row", gap: 8, alignItems: "flex-end", marginTop: 6 },
  mais: { width: 50, height: 50, borderRadius: 14, backgroundColor: cores.azul, alignItems: "center", justifyContent: "center" },
  fonte: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingHorizontal: 4, marginTop: 4 },
});
