"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AREA_LABEL, AREAS, BANCAS, CONTEST_STATUS, CONTEST_STATUS_LABEL, ESCOLARIDADE_LABEL, ESCOLARIDADES, ESFERAS, numeroBR, UFS } from "@aviso/shared";
import { salvarConcursoAcao } from "@/lib/admin/acoes/concursos";
import { errosZodPt } from "@/lib/admin/campos-form";
import { camposRelevantesAlterados, ConcursoDados, dadosDoModelo, ROTULO_CAMPO, type ModeloConcurso } from "@/lib/admin/concurso-form";
import { novaChave } from "@/lib/admin/campos-form";
import { Girando } from "../AcaoBotao";
import { Dialogo } from "../Dialogo";
import { EditorCargos, EditorDatas } from "../editores";
import { useToast } from "../Toasts";
import { Aviso, botao, Campo, campoCls, cx } from "../ui";

export function EditorConcurso({
  id,
  modeloInicial,
  publicado,
  seguidores,
  materias,
}: {
  id: string | null;
  /** Calculado no servidor (chaves estáveis entre SSR e hidratação). */
  modeloInicial: ModeloConcurso;
  publicado: boolean;
  seguidores: number;
  materias: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [modelo, setModelo] = useState<ModeloConcurso>(modeloInicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentou, setTentou] = useState(false);
  const [errata, setErrata] = useState<{ alterados: string[]; dados: ConcursoDados } | null>(null);
  const [resumo, setResumo] = useState("");
  const [pendente, iniciar] = useTransition();

  const dadosIniciais = useMemo(() => (id ? (dadosDoModelo(modeloInicial).valor as ConcursoDados) : null), [id, modeloInicial]);
  const sujo = useMemo(() => JSON.stringify(modelo) !== JSON.stringify(modeloInicial), [modelo, modeloInicial]);
  const nomePorId = useMemo(() => new Map(materias.map((m) => [m.id, m.nome])), [materias]);
  const idPorNome = useMemo(() => new Map(materias.map((m) => [m.nome.toLowerCase(), m.id])), [materias]);

  useEffect(() => {
    if (!sujo) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sujo]);

  function validar(m: ModeloConcurso) {
    const { valor, erros: conv } = dadosDoModelo(m);
    const v = ConcursoDados.safeParse(valor);
    const todos = { ...(v.success ? {} : errosZodPt(v.error)), ...conv };
    return { dados: v.success && !Object.keys(conv).length ? v.data : null, erros: todos };
  }

  const muda = (p: Partial<ModeloConcurso>) => {
    const novo = { ...modelo, ...p };
    setModelo(novo);
    if (tentou) setErros(validar(novo).erros);
  };

  function enviar(dados: ConcursoDados, modo: "direto" | "errata") {
    iniciar(async () => {
      const r = await salvarConcursoAcao(id, dados, modo, resumo);
      if (!r.ok && r.campos) setErros(r.campos);
      if (toast.resultado(r) && r.ok) {
        setErrata(null);
        if (!id && r.dados?.id) router.push(`/admin/concursos/${r.dados.id}`);
      }
    });
  }

  function salvar() {
    setTentou(true);
    const { dados, erros: e } = validar(modelo);
    setErros(e);
    if (!dados) {
      toast.erro(`Corrija ${Object.keys(e).length} campo(s) destacado(s).`);
      setTimeout(() => document.querySelector("[data-erro='1'], .text-verm")?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
      return;
    }
    if (id && dadosIniciais && publicado && seguidores > 0) {
      const alterados = camposRelevantesAlterados(dadosIniciais, dados);
      if (alterados.length) {
        setResumo(alterados.includes("datas") ? "Retificação: mudança no cronograma." : `Retificação: ${alterados.map((k) => ROTULO_CAMPO[k].toLowerCase()).join(", ")}.`);
        setErrata({ alterados, dados });
        return;
      }
    }
    enviar(dados, "direto");
  }

  const e = (k: string) => erros[k];
  const chips = (lista: readonly string[], rotulos: Record<string, string>, sel: string[], set: (v: string[]) => void) => (
    <div className="flex flex-wrap gap-1.5">
      {lista.map((a) => {
        const on = sel.includes(a);
        return (
          <button
            key={a}
            type="button"
            aria-pressed={on}
            onClick={() => set(on ? sel.filter((x) => x !== a) : [...sel, a])}
            className={cx("min-h-8 rounded-full border px-2.5 text-[12px] font-semibold", on ? "border-azul bg-azul text-white" : "border-linha bg-branco text-tx2 hover:border-tinta/40")}
          >
            {rotulos[a]}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 pb-24">
      {tentou && Object.keys(erros).length > 0 && <Aviso tom="verm">{Object.keys(erros).length} campo(s) com problema, marcados em vermelho.</Aviso>}

      <fieldset disabled={pendente} className="space-y-4">
        <Secao titulo="Dados do concurso">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6">
            <Campo rotulo="Título no app" erro={e("titulo")} className="col-span-2 sm:col-span-4">
              <input className={campoCls} value={modelo.titulo} onChange={(x) => muda({ titulo: x.target.value })} placeholder="Ex.: INSS · Técnico do Seguro Social" />
            </Campo>
            <Campo rotulo="Situação" erro={e("status")} className="col-span-2">
              <select className={campoCls} value={modelo.status} onChange={(x) => muda({ status: x.target.value })}>
                {CONTEST_STATUS.map((st) => (
                  <option key={st} value={st}>
                    {CONTEST_STATUS_LABEL[st]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Órgão" erro={e("orgao")} className="col-span-2 sm:col-span-4">
              <input className={campoCls} value={modelo.orgao} onChange={(x) => muda({ orgao: x.target.value })} />
            </Campo>
            <Campo rotulo="Sigla" erro={e("orgao_sigla")} className="sm:col-span-2">
              <input className={campoCls} value={modelo.orgao_sigla} onChange={(x) => muda({ orgao_sigla: x.target.value })} />
            </Campo>
            <Campo rotulo="Esfera" erro={e("esfera")} className="sm:col-span-2">
              <select className={campoCls} value={modelo.esfera} onChange={(x) => muda({ esfera: x.target.value })}>
                {ESFERAS.map((x) => (
                  <option key={x} value={x}>
                    {x[0].toUpperCase() + x.slice(1)}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="UF" erro={e("uf")}>
              <select className={cx(campoCls, "font-mono")} value={modelo.uf} onChange={(x) => muda({ uf: x.target.value })}>
                <option value="">Nacional</option>
                {UFS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Cidade" erro={e("cidade")} className="sm:col-span-3">
              <input className={campoCls} value={modelo.cidade} onChange={(x) => muda({ cidade: x.target.value })} />
            </Campo>
            <Campo rotulo="Banca" erro={e("banca")} className="sm:col-span-2">
              <input list="adm-bancas-c" className={campoCls} value={modelo.banca} onChange={(x) => muda({ banca: x.target.value })} />
              <datalist id="adm-bancas-c">
                {BANCAS.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Campo>
            <Campo rotulo="Nº do edital" erro={e("numero_edital")} className="sm:col-span-2">
              <input className={cx(campoCls, "font-mono")} value={modelo.numero_edital} onChange={(x) => muda({ numero_edital: x.target.value })} />
            </Campo>
            <Campo rotulo="Ano" erro={e("ano")}>
              <input inputMode="numeric" className={cx(campoCls, "font-mono")} value={modelo.ano} onChange={(x) => muda({ ano: x.target.value })} />
            </Campo>
            <Campo rotulo="Publicado em" erro={e("publicado_em")}>
              <input type="date" className={cx(campoCls, "font-mono")} value={modelo.publicado_em} onChange={(x) => muda({ publicado_em: x.target.value })} />
            </Campo>
            <Campo rotulo="URL oficial" erro={e("url_oficial")} className="col-span-2 sm:col-span-4" ajuda="Todo aviso leva este link para a fonte oficial.">
              <input type="url" className={cx(campoCls, "font-mono text-[12.5px]")} value={modelo.url_oficial} onChange={(x) => muda({ url_oficial: x.target.value })} />
            </Campo>
            <Campo rotulo="Taxa (R$)" erro={e("taxa_centavos")} className="sm:col-span-2">
              <input inputMode="decimal" placeholder="0,00" className={cx(campoCls, "font-mono")} value={modelo.taxa} onChange={(x) => muda({ taxa: x.target.value })} />
            </Campo>
            <Campo rotulo="Resumo" erro={e("resumo")} className="col-span-2 sm:col-span-6">
              <textarea rows={2} className={campoCls} value={modelo.resumo} onChange={(x) => muda({ resumo: x.target.value })} />
            </Campo>
            <div className="col-span-2 sm:col-span-6">
              <p className="mb-1 text-[12px] font-semibold text-tx2">Escolaridade (além das dos cargos)</p>
              {chips(ESCOLARIDADES, ESCOLARIDADE_LABEL, modelo.escolaridades, (v) => muda({ escolaridades: v }))}
            </div>
            <div className="col-span-2 sm:col-span-6">
              <p className="mb-1 text-[12px] font-semibold text-tx2">Áreas</p>
              {chips(AREAS, AREA_LABEL, modelo.areas, (v) => muda({ areas: v }))}
            </div>
            <div className="col-span-2 flex flex-wrap gap-x-6 gap-y-2 sm:col-span-6">
              <Marcar rotulo="Tem cadastro reserva" valor={modelo.cadastro_reserva} muda={(v) => muda({ cadastro_reserva: v })} />
              {!id && <Marcar rotulo="Publicar ao salvar (aparece no app)" valor={modelo.publicado} muda={(v) => muda({ publicado: v })} />}
              <Marcar rotulo="Concurso de exemplo (só desenvolvimento)" valor={modelo.exemplo} muda={(v) => muda({ exemplo: v })} />
            </div>
          </div>
        </Secao>

        <Secao titulo={`Cargos (${modelo.cargos.length})`} sub="Vagas e salário máximo do concurso são recalculados a partir dos cargos.">
          <EditorCargos cargos={modelo.cargos} onChange={(cargos) => muda({ cargos })} erros={erros} comMaterias={false} comOrigem={false} />
        </Secao>

        <Secao titulo={`Datas (${modelo.datas.length})`} sub="Mudar datas de um concurso publicado muda a agenda de quem acompanha.">
          <EditorDatas datas={modelo.datas} onChange={(datas) => muda({ datas })} erros={erros} />
        </Secao>

        <Secao titulo={`Matérias (${modelo.materias.length})`} sub="Só matérias canônicas: é o que cruza editais diferentes em “Matérias em comum”.">
          <datalist id="adm-materias-c">
            {materias.map((m) => (
              <option key={m.id} value={m.nome} />
            ))}
          </datalist>
          <div className="space-y-1.5">
            {modelo.materias.length === 0 && <p className="rounded-xl border border-dashed border-linha px-4 py-3 text-[13px] text-tx2">Nenhuma matéria.</p>}
            {modelo.materias.map((m, i) => {
              const set = (p: Partial<typeof m>) => muda({ materias: modelo.materias.map((x, j) => (j === i ? { ...x, ...p } : x)) });
              return (
                <div key={m.k} className="grid grid-cols-[1fr_80px_36px] gap-1.5 sm:grid-cols-[1fr_220px_90px_36px]">
                  <div>
                    <input
                      list="adm-materias-c"
                      aria-label="Matéria"
                      className={cx(campoCls, "min-h-9 py-1.5", e(`materias.${i}.subject_id`) && "border-verm")}
                      value={m.nome}
                      placeholder="Digite para buscar…"
                      onChange={(x) => set({ nome: x.target.value, subject_id: idPorNome.get(x.target.value.toLowerCase()) ?? "" })}
                    />
                    {e(`materias.${i}.subject_id`) && <span className="text-[11.5px] font-semibold text-verm">{e(`materias.${i}.subject_id`)}</span>}
                  </div>
                  <select aria-label="Cargo" className={cx(campoCls, "col-span-3 row-start-2 min-h-9 py-1.5 sm:col-span-1 sm:row-start-auto")} value={m.cargo} onChange={(x) => set({ cargo: x.target.value })}>
                    <option value="">Todos os cargos</option>
                    {modelo.cargos.map((c, j) => (
                      <option key={c.k} value={c.k}>
                        {c.nome || `Cargo ${j + 1}`}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Questões"
                    inputMode="numeric"
                    placeholder="questões"
                    className={cx(campoCls, "min-h-9 py-1.5 font-mono", e(`materias.${i}.questoes`) && "border-verm")}
                    value={m.questoes}
                    onChange={(x) => set({ questoes: x.target.value })}
                  />
                  <button type="button" aria-label="Remover matéria" className="grid size-9 place-items-center rounded-lg text-lg text-tx2 hover:bg-verm-t hover:text-verm" onClick={() => muda({ materias: modelo.materias.filter((_, j) => j !== i) })}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" className={botao("sec", "sm", "mt-2")} onClick={() => muda({ materias: [...modelo.materias, { k: novaChave(), subject_id: "", nome: "", cargo: "", questoes: "" }] })}>
            + Adicionar matéria
          </button>
          {modelo.materias.some((m) => m.subject_id && !nomePorId.has(m.subject_id)) && <p className="mt-2 text-[12px] text-verm">Há matéria que não existe mais na lista canônica.</p>}
        </Secao>

        <Secao titulo="Texto do edital" sub="Base do Pergunte ao edital (plano Aprovado): a IA responde só com este texto, citando item e página.">
          <textarea
            rows={12}
            className={cx(campoCls, "font-mono text-[12px] leading-relaxed")}
            value={modelo.edital_texto}
            onChange={(x) => muda({ edital_texto: x.target.value })}
            placeholder="Cole aqui o texto integral do edital (mantenha a numeração dos itens)."
          />
          <p className="mt-1 text-right font-mono text-[11.5px] text-tx2">
            {numeroBR(modelo.edital_texto.length)} caracteres · ≈ {numeroBR(Math.round(modelo.edital_texto.length / 4))} tokens
          </p>
        </Secao>
      </fieldset>

      {/* Barra de salvar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-branco/95 px-4 py-2.5 backdrop-blur lg:left-[232px] lg:px-6">
        <div className="mx-auto flex max-w-[1480px] items-center justify-end gap-3">
          <span className={cx("mr-auto text-[13px]", sujo ? "font-semibold text-tinta" : "text-tx2")}>
            {sujo ? "Alterações não salvas" : id ? "Tudo salvo" : "Novo concurso"}
            {id && publicado && seguidores > 0 && <span className="ml-2 hidden font-normal text-tx2 sm:inline">· {numeroBR(seguidores)} {seguidores === 1 ? "pessoa acompanha" : "pessoas acompanham"}</span>}
          </span>
          {sujo && id && (
            <button type="button" className={botao("sec")} onClick={() => { setModelo(modeloInicial); setErros({}); setTentou(false); }} disabled={pendente}>
              Descartar
            </button>
          )}
          <button type="button" className={botao("primario")} onClick={salvar} disabled={pendente || (!!id && !sujo)}>
            {pendente && !errata ? <Girando /> : null}
            {id ? "Salvar alterações" : "Criar concurso"}
          </button>
        </div>
      </div>

      <Dialogo
        aberto={!!errata}
        aoFechar={() => !pendente && setErrata(null)}
        titulo="Avisar quem acompanha?"
        largura="lg"
        rodape={
          <>
            <button type="button" className={botao("sec")} onClick={() => setErrata(null)} disabled={pendente}>
              Cancelar
            </button>
            <button type="button" className={botao("sec")} onClick={() => errata && enviar(errata.dados, "direto")} disabled={pendente}>
              Corrigir sem avisar
            </button>
            <button type="button" className={botao("primario")} onClick={() => errata && enviar(errata.dados, "errata")} disabled={pendente || resumo.trim().length < 5}>
              {pendente && <Girando />} Registrar errata e avisar {seguidores === 1 ? "1 pessoa" : `${numeroBR(seguidores)} pessoas`}
            </button>
          </>
        }
      >
        <p className="text-tx2">
          Este concurso está publicado e <b className="text-tinta">{numeroBR(seguidores)} {seguidores === 1 ? "pessoa acompanha" : "pessoas acompanham"}</b>. Você mudou:{" "}
          <b className="text-tinta">{errata?.alterados.map((k) => ROTULO_CAMPO[k] ?? k).join(", ")}</b>.
        </p>
        <ul className="mt-3 space-y-1.5 text-[13px]">
          <li>
            <b>Registrar como errata e avisar:</b> cria uma nova versão com o que mudou, atualiza a agenda de quem acompanha e manda push só para essas pessoas.
          </li>
          <li>
            <b>Corrigir sem avisar:</b> para erro de digitação nosso. A agenda muda, mas ninguém recebe aviso e não aparece como errata.
          </li>
        </ul>
        <label className="mt-4 block">
          <span className="mb-1 block text-[12px] font-semibold text-tx2">Resumo da errata (aparece no aviso e no histórico)</span>
          <input className={campoCls} value={resumo} onChange={(x) => setResumo(x.target.value)} maxLength={300} />
        </label>
      </Dialogo>
    </div>
  );
}

function Secao({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-linha bg-branco p-4">
      <h2 className="font-sans text-[14px] font-bold normal-case tracking-normal">{titulo}</h2>
      {sub && <p className="mt-0.5 text-[12.5px] text-tx2">{sub}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Marcar({ rotulo, valor, muda }: { rotulo: string; valor: boolean; muda: (v: boolean) => void }) {
  return (
    <label className="flex min-h-10 items-center gap-2 text-[13px]">
      <input type="checkbox" className="size-4 accent-azul" checked={valor} onChange={(x) => muda(x.target.checked)} />
      {rotulo}
    </label>
  );
}
