"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ACT_TIPO_LABEL, ACT_TIPOS, AREA_LABEL, AREAS, BANCAS, dataHoraBR, ESFERAS, UFS } from "@aviso/shared";
import { aprovarExtracaoAcao, rejeitarExtracaoAcao } from "@/lib/admin/acoes/revisao";
import { alertaDe, camposBaixaConfianca, deCampos, errosZodPt, paraCampos, type ModeloCampos } from "@/lib/admin/campos-form";
import type { ExtracaoDetalhe } from "@/lib/admin/consultas/revisao";
import { EXTRACAO_STATUS_ROTULO, EXTRACAO_STATUS_TOM, idade, pct, tomConfianca } from "@/lib/admin/formato";
import { CamposExtraidos } from "@/lib/pipeline/schema";
import { Girando } from "../AcaoBotao";
import { Dialogo } from "../Dialogo";
import { DocumentoOriginal } from "../DocumentoOriginal";
import { ComLocalizar, EditorCargos, EditorDatas } from "../editores";
import { useToast } from "../Toasts";
import { Aviso, botao, Campo, campoCls, cx, Etiqueta } from "../ui";

const MOTIVOS_PRONTOS = ["Não é concurso público", "Ato duplicado (já processado)", "Documento ilegível ou incompleto", "Processo seletivo simplificado fora do escopo"];

type Nav = { anterior: string | null; proxima: string | null; posicao: number | null; total: number; primeira: string | null };

export function TelaRevisao({ ex, nav, materias, limiar }: { ex: ExtracaoDetalhe; nav: Nav; materias: string[]; limiar: number }) {
  const router = useRouter();
  const toast = useToast();
  const [modelo, setModelo] = useState<ModeloCampos>(() => deCampos(ex.campos_json));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentou, setTentou] = useState(false);
  const [pedido, setPedido] = useState<{ termo: string; n: number }>();
  const [rejeitando, setRejeitando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [aba, setAba] = useState<"campos" | "doc">("campos");
  const [pendente, iniciar] = useTransition();
  const formRef = useRef<HTMLDivElement>(null);

  const somenteLeitura = ex.status !== "pendente";
  const baixa = useMemo(() => camposBaixaConfianca(ex.campos_json, ex.motivo_revisao, limiar), [ex.campos_json, ex.motivo_revisao, limiar]);
  const nBaixa = Object.keys(baixa).length;

  const validar = useCallback((m: ModeloCampos) => {
    const { valor, erros: conv } = paraCampos(m);
    const v = CamposExtraidos.safeParse(valor);
    const todos = { ...(v.success ? {} : errosZodPt(v.error)), ...conv };
    return { dados: v.success && !Object.keys(conv).length ? v.data : null, erros: todos };
  }, []);

  const muda = (p: Partial<ModeloCampos>) => {
    const novo = { ...modelo, ...p };
    setModelo(novo);
    if (tentou) setErros(validar(novo).erros);
  };

  const localizar = (t: string) => {
    setPedido((p) => ({ termo: t, n: (p?.n ?? 0) + 1 }));
    setAba("doc");
  };

  const destinoDepois = nav.proxima ?? nav.anterior ?? null;
  const irPara = useCallback((id: string | null) => router.push(id ? `/admin/revisao/${id}` : "/admin/revisao"), [router]);

  const aprovar = useCallback(() => {
    if (somenteLeitura || pendente) return;
    setTentou(true);
    const { dados, erros: e } = validar(modelo);
    setErros(e);
    if (!dados) {
      toast.erro(`Corrija ${Object.keys(e).length} campo(s) destacado(s) antes de aprovar.`);
      setAba("campos");
      setTimeout(() => formRef.current?.querySelector("[data-erro='1']")?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
      return;
    }
    iniciar(async () => {
      const r = await aprovarExtracaoAcao(ex.id, dados);
      if (!r.ok && r.campos) setErros(r.campos);
      if (toast.resultado(r)) irPara(destinoDepois);
    });
  }, [somenteLeitura, pendente, validar, modelo, toast, ex.id, irPara, destinoDepois]);

  const rejeitar = () => {
    iniciar(async () => {
      const r = await rejeitarExtracaoAcao(ex.id, motivo);
      if (toast.resultado(r)) {
        setRejeitando(false);
        irPara(destinoDepois);
      }
    });
  };

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || rejeitando) return;
      const el = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === "a" && !somenteLeitura) {
        e.preventDefault();
        aprovar();
      } else if (k === "r" && !somenteLeitura) {
        e.preventDefault();
        setRejeitando(true);
      } else if (k === "j") {
        e.preventDefault();
        irPara(nav.proxima ?? nav.primeira);
      } else if (k === "k" && nav.anterior) {
        e.preventDefault();
        irPara(nav.anterior);
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aprovar, irPara, nav, rejeitando, somenteLeitura]);

  const e = (k: string) => erros[k];
  const b = (k: string) => alertaDe(baixa, k);
  const tom = tomConfianca(ex.confianca, limiar);

  return (
    <>
      {/* Barra de ações fixa */}
      <div className="sticky top-14 z-20 -mx-4 -mt-5 mb-4 border-b border-linha bg-branco/95 px-4 py-2.5 backdrop-blur sm:-mt-6 lg:-mx-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link href="/admin/revisao" className="grid size-9 shrink-0 place-items-center rounded-lg border border-linha text-tx2 hover:text-tinta" aria-label="Voltar para a fila">
              ←
            </Link>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold">{modelo.titulo || modelo.orgao || "Extração sem órgão"}</p>
              <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-tx2">
                <Etiqueta tom="tinta">{ACT_TIPO_LABEL[modelo.tipo_ato as keyof typeof ACT_TIPO_LABEL] ?? modelo.tipo_ato}</Etiqueta>
                <Etiqueta tom={tom} titulo="Confiança geral da extração">
                  {pct(ex.confianca)} confiança
                </Etiqueta>
                {somenteLeitura && <Etiqueta tom={EXTRACAO_STATUS_TOM[ex.status]}>{EXTRACAO_STATUS_ROTULO[ex.status]}</Etiqueta>}
                <span className="hidden font-mono sm:inline">{ex.modelo}</span>
                <span className="hidden sm:inline">· {idade(ex.created_at)}</span>
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-1.5 sm:w-auto">
            {nav.posicao && (
              <span className="mr-1 whitespace-nowrap font-mono text-[12px] text-tx2">
                {nav.posicao} de {nav.total}
              </span>
            )}
            <button type="button" className={botao("sec", "sm", "min-h-10 px-3")} disabled={!nav.anterior} onClick={() => irPara(nav.anterior)} title="Anterior (K)">
              ‹ <kbd className="hidden font-mono text-[11px] text-tx2 sm:inline">K</kbd>
            </button>
            <button type="button" className={botao("sec", "sm", "min-h-10 px-3")} disabled={!nav.proxima && !nav.primeira} onClick={() => irPara(nav.proxima ?? nav.primeira)} title="Pular para a próxima (J)">
              Pular <kbd className="hidden font-mono text-[11px] text-tx2 sm:inline">J</kbd>
            </button>
            {!somenteLeitura && (
              <>
                <button type="button" className={botao("sec", "sm", "min-h-10 border-verm/40 px-3 text-verm hover:border-verm")} onClick={() => setRejeitando(true)} disabled={pendente}>
                  Rejeitar <kbd className="hidden font-mono text-[11px] sm:inline">R</kbd>
                </button>
                <button type="button" className={botao("primario", "sm", "min-h-10 flex-1 px-4 sm:flex-none")} onClick={aprovar} disabled={pendente}>
                  {pendente && !rejeitando ? <Girando /> : null}
                  Aprovar<span className="hidden sm:inline"> e publicar</span> <kbd className="hidden rounded bg-white/15 px-1 font-mono text-[11px] sm:inline">A</kbd>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Abas no celular */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-linha bg-branco p-1 lg:hidden" role="tablist">
        {(["campos", "doc"] as const).map((a) => (
          <button
            key={a}
            role="tab"
            aria-selected={aba === a}
            onClick={() => setAba(a)}
            className={cx("min-h-10 rounded-md text-[13px] font-semibold", aba === a ? "bg-tinta text-white" : "text-tx2")}
          >
            {a === "campos" ? "Campos extraídos" : "Documento original"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <DocumentoOriginal
          doc={ex.doc}
          pedido={pedido}
          className={cx("h-[70dvh] lg:sticky lg:top-[136px] lg:h-[calc(100dvh-152px)]", aba !== "doc" && "hidden lg:flex")}
        />

        <div ref={formRef} className={cx("min-w-0 space-y-4", aba !== "campos" && "hidden lg:block")}>
          {somenteLeitura && (
            <Aviso tom="azul">
              {EXTRACAO_STATUS_ROTULO[ex.status]} {ex.revisor ? `por ${ex.revisor}` : ""} em {dataHoraBR(ex.revisado_em ?? ex.created_at)}. Somente leitura.
            </Aviso>
          )}
          {ex.motivo_revisao && (
            <Aviso>
              <b>Por que veio para revisão:</b> {ex.motivo_revisao}
            </Aviso>
          )}
          {(ex.contest_id || modelo.tipo_ato === "retificacao") && (
            <Aviso tom={ex.contest_id ? "azul" : "verm"}>
              {ex.contest_id ? (
                <>
                  Ligada ao concurso{" "}
                  <Link href={`/admin/concursos/${ex.contest_id}`} className="font-semibold text-azul hover:underline">
                    {ex.contest_titulo}
                  </Link>
                  . Ao aprovar, o pipeline atualiza esse concurso e avisa só quem acompanha.
                </>
              ) : (
                <>Retificação sem concurso ligado: o pipeline vai procurar pelo órgão + nº do edital + ano. Confira esses três campos.</>
              )}
            </Aviso>
          )}
          {nBaixa > 0 && !somenteLeitura && (
            <p className="text-[12.5px] text-tx2">
              <span className="grifo font-semibold text-tinta">Grifados</span>: {nBaixa} {nBaixa === 1 ? "ponto" : "pontos"} de baixa confiança para conferir no documento. Use a lupa
              dos campos para localizar o valor no texto.
            </p>
          )}
          {tentou && Object.keys(erros).length > 0 && (
            <Aviso tom="verm">
              {Object.keys(erros).length} campo(s) com problema. Os campos estão marcados em vermelho.
              {erros._ && <> {erros._}</>}
            </Aviso>
          )}

          <fieldset disabled={somenteLeitura || pendente} className="space-y-4">
            <Secao titulo="Ato e órgão">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6">
                <Campo rotulo="Tipo de ato" erro={e("tipo_ato")} baixaConfianca={b("tipo_ato")} className="col-span-2">
                  <select className={campoCls} value={modelo.tipo_ato} onChange={(x) => muda({ tipo_ato: x.target.value })} data-erro={e("tipo_ato") ? 1 : 0}>
                    {ACT_TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {ACT_TIPO_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo rotulo="Órgão" erro={e("orgao")} baixaConfianca={b("orgao")} className="col-span-2 sm:col-span-4">
                  <ComLocalizar valor={modelo.orgao} localizar={localizar}>
                    <input className={cx(campoCls, "pr-10")} value={modelo.orgao} onChange={(x) => muda({ orgao: x.target.value })} data-erro={e("orgao") ? 1 : 0} />
                  </ComLocalizar>
                </Campo>
                <Campo rotulo="Sigla" erro={e("orgao_sigla")} baixaConfianca={b("orgao_sigla")} className="sm:col-span-2">
                  <input className={campoCls} value={modelo.orgao_sigla} onChange={(x) => muda({ orgao_sigla: x.target.value })} />
                </Campo>
                <Campo rotulo="Esfera" erro={e("esfera")} baixaConfianca={b("esfera")} className="sm:col-span-2">
                  <select className={campoCls} value={modelo.esfera} onChange={(x) => muda({ esfera: x.target.value })} data-erro={e("esfera") ? 1 : 0}>
                    <option value="">—</option>
                    {ESFERAS.map((x) => (
                      <option key={x} value={x}>
                        {x[0].toUpperCase() + x.slice(1)}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo rotulo="UF" erro={e("uf")} baixaConfianca={b("uf")}>
                  <select className={cx(campoCls, "font-mono")} value={modelo.uf} onChange={(x) => muda({ uf: x.target.value })}>
                    <option value="">Nacional</option>
                    {UFS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo rotulo="Ano" erro={e("ano")} baixaConfianca={b("ano")}>
                  <input inputMode="numeric" className={cx(campoCls, "font-mono")} value={modelo.ano} onChange={(x) => muda({ ano: x.target.value })} data-erro={e("ano") ? 1 : 0} />
                </Campo>
                <Campo rotulo="Cidade" erro={e("cidade")} baixaConfianca={b("cidade")} className="sm:col-span-2">
                  <input className={campoCls} value={modelo.cidade} onChange={(x) => muda({ cidade: x.target.value })} />
                </Campo>
                <Campo rotulo="Banca" erro={e("banca")} baixaConfianca={b("banca")} className="sm:col-span-2">
                  <ComLocalizar valor={modelo.banca} localizar={localizar}>
                    <input list="adm-bancas" className={cx(campoCls, "pr-10")} value={modelo.banca} onChange={(x) => muda({ banca: x.target.value })} />
                  </ComLocalizar>
                  <datalist id="adm-bancas">
                    {BANCAS.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </Campo>
                <Campo rotulo="Nº do edital" erro={e("numero_edital")} baixaConfianca={b("numero_edital")} className="sm:col-span-2">
                  <ComLocalizar valor={modelo.numero_edital} localizar={localizar}>
                    <input className={cx(campoCls, "pr-10 font-mono")} value={modelo.numero_edital} onChange={(x) => muda({ numero_edital: x.target.value })} />
                  </ComLocalizar>
                </Campo>
              </div>
            </Secao>

            <Secao titulo="Publicação">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Campo rotulo="Título no app" erro={e("titulo")} baixaConfianca={b("titulo")} className="col-span-2 sm:col-span-4">
                  <input className={campoCls} value={modelo.titulo} onChange={(x) => muda({ titulo: x.target.value })} placeholder="Ex.: INSS · Técnico do Seguro Social" />
                </Campo>
                <Campo rotulo="Resumo" erro={e("resumo")} baixaConfianca={b("resumo")} className="col-span-2 sm:col-span-4">
                  <textarea rows={2} className={campoCls} value={modelo.resumo} onChange={(x) => muda({ resumo: x.target.value })} />
                </Campo>
                <Campo
                  rotulo="URL oficial"
                  erro={e("url_oficial")}
                  baixaConfianca={b("url_oficial")}
                  className="col-span-2 sm:col-span-3"
                  ajuda="Todo aviso leva este link. Precisa abrir a fonte oficial."
                >
                  <div className="flex gap-1.5">
                    <input type="url" className={cx(campoCls, "font-mono text-[12.5px]")} value={modelo.url_oficial} onChange={(x) => muda({ url_oficial: x.target.value })} data-erro={e("url_oficial") ? 1 : 0} />
                    {/^https?:\/\//.test(modelo.url_oficial) && (
                      <a href={modelo.url_oficial} target="_blank" rel="noopener noreferrer" className={botao("sec", "sm", "min-h-10")} title="Abrir link oficial">
                        Abrir
                      </a>
                    )}
                  </div>
                </Campo>
                <Campo rotulo="Taxa (R$)" erro={e("taxa_centavos")} baixaConfianca={b("taxa_centavos")}>
                  <ComLocalizar valor={modelo.taxa} localizar={localizar}>
                    <input inputMode="decimal" placeholder="0,00" className={cx(campoCls, "pr-10 font-mono")} value={modelo.taxa} onChange={(x) => muda({ taxa: x.target.value })} data-erro={e("taxa_centavos") ? 1 : 0} />
                  </ComLocalizar>
                </Campo>
                <div className="col-span-2 sm:col-span-4">
                  <p className="mb-1 text-[12px] font-semibold text-tx2">Áreas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AREAS.map((a) => {
                      const on = modelo.areas.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          aria-pressed={on}
                          onClick={() => muda({ areas: on ? modelo.areas.filter((x) => x !== a) : [...modelo.areas, a] })}
                          className={cx("min-h-8 rounded-full border px-2.5 text-[12px] font-semibold", on ? "border-azul bg-azul text-white" : "border-linha bg-branco text-tx2 hover:border-tinta/40")}
                        >
                          {AREA_LABEL[a]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Campo rotulo="Etapas (uma por linha)" erro={e("etapas")} className="col-span-2 sm:col-span-4">
                  <textarea rows={2} className={campoCls} value={modelo.etapas} onChange={(x) => muda({ etapas: x.target.value })} placeholder={"Prova objetiva\nProva discursiva"} />
                </Campo>
              </div>
            </Secao>

            <Secao titulo={`Cargos (${modelo.cargos.length})`}>
              <div data-erro={Object.keys(erros).some((k) => k.startsWith("cargos")) ? 1 : 0} />
              <EditorCargos
                cargos={modelo.cargos}
                onChange={(cargos) => muda({ cargos })}
                erros={erros}
                baixa={baixa}
                comMaterias
                sugestoesMaterias={materias}
                localizar={localizar}
              />
            </Secao>

            <Secao titulo={`Datas (${modelo.datas.length})`}>
              <div data-erro={Object.keys(erros).some((k) => k.startsWith("datas")) ? 1 : 0} />
              <EditorDatas datas={modelo.datas} onChange={(datas) => muda({ datas })} erros={erros} baixa={baixa} localizar={localizar} />
            </Secao>
          </fieldset>

          <p className="pb-6 text-center text-[12px] text-tx2">
            Atalhos: <kbd className="font-mono">A</kbd> aprovar · <kbd className="font-mono">R</kbd> rejeitar · <kbd className="font-mono">J</kbd> próxima ·{" "}
            <kbd className="font-mono">K</kbd> anterior · <kbd className="font-mono">/</kbd> busca global
          </p>
        </div>
      </div>

      <Dialogo
        aberto={rejeitando}
        aoFechar={() => !pendente && setRejeitando(false)}
        titulo="Rejeitar extração"
        rodape={
          <>
            <button type="button" className={botao("sec")} onClick={() => setRejeitando(false)} disabled={pendente}>
              Cancelar
            </button>
            <button type="button" className={botao("perigo")} onClick={rejeitar} disabled={pendente || motivo.trim().length < 3}>
              {pendente && <Girando />} Rejeitar
            </button>
          </>
        }
      >
        <p className="mb-3 text-tx2">A extração não vira concurso nem aviso. O motivo fica registrado na auditoria.</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {MOTIVOS_PRONTOS.map((m) => (
            <button key={m} type="button" onClick={() => setMotivo(m)} className={cx("min-h-8 rounded-full border px-2.5 text-[12px]", motivo === m ? "border-tinta bg-tinta text-white" : "border-linha hover:border-tinta/40")}>
              {m}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-tx2">Motivo</span>
          <textarea autoFocus rows={3} className={campoCls} value={motivo} onChange={(x) => setMotivo(x.target.value)} />
        </label>
      </Dialogo>
    </>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-linha bg-branco p-4">
      <h2 className="mb-3 font-sans text-[14px] font-bold normal-case tracking-normal">{titulo}</h2>
      {children}
    </section>
  );
}
