"use client";

// Editores de listas compartilhados pela fila de revisão e pela edição de concursos.
import { AREA_LABEL, AREAS, DATE_TIPO_LABEL, DATE_TIPOS, ESCOLARIDADE_LABEL, ESCOLARIDADES } from "@aviso/shared";
import type { ReactNode } from "react";
import { alertaDe, cargoVazio, dataVazia, novaChave, type CargoForm, type DataForm } from "@/lib/admin/campos-form";
import { Icone } from "./icones";
import { botao, campoCls, Campo, cx } from "./ui";

export type Localizar = (texto: string) => void;

/** Input com botão "localizar no documento" opcional. */
export function ComLocalizar({ valor, localizar, children }: { valor: string; localizar?: Localizar; children: ReactNode }) {
  if (!localizar) return <>{children}</>;
  return (
    <div className="relative">
      {children}
      <button
        type="button"
        tabIndex={-1}
        disabled={!valor.trim()}
        onClick={() => localizar(valor)}
        title="Localizar no documento"
        aria-label="Localizar no documento"
        className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-tx2 hover:bg-azul-t hover:text-azul disabled:opacity-30"
      >
        <Icone nome="busca" className="size-3.5" />
      </button>
    </div>
  );
}

/** "2026-11-05" → "05/11/2026" (para procurar no texto do edital). */
const isoParaBR = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split("-").reverse().join("/") : d);

export function EditorCargos({
  cargos,
  onChange,
  erros,
  baixa = {},
  comMaterias,
  comOrigem = true,
  sugestoesMaterias = [],
  localizar,
}: {
  cargos: CargoForm[];
  onChange: (c: CargoForm[]) => void;
  erros: Record<string, string>;
  baixa?: Record<string, string>;
  comMaterias: boolean;
  /** Item/página do edital (só existe na extração; contest_roles não guarda origem). */
  comOrigem?: boolean;
  sugestoesMaterias?: string[];
  localizar?: Localizar;
}) {
  const muda = (i: number, p: Partial<CargoForm>) => onChange(cargos.map((c, j) => (j === i ? { ...c, ...p } : c)));
  return (
    <div className="space-y-3">
      <datalist id="adm-areas">
        {AREAS.map((a) => (
          <option key={a} value={a}>
            {AREA_LABEL[a]}
          </option>
        ))}
      </datalist>
      {comMaterias && (
        <datalist id="adm-materias">
          {sugestoesMaterias.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      )}
      {cargos.length === 0 && <p className="rounded-xl border border-dashed border-linha px-4 py-3 text-[13px] text-tx2">Nenhum cargo. Atos de previsão às vezes não trazem cargos.</p>}
      {cargos.map((c, i) => {
        const p = `cargos.${i}`;
        return (
          <fieldset key={c.k} className={cx("rounded-xl border p-3", alertaDe(baixa, p) && !Object.keys(baixa).some((k) => k.startsWith(p + ".")) ? "border-ambar/50 bg-marca-t/40" : "border-linha")}>
            <legend className="sr-only">Cargo {i + 1}</legend>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-tx2">Cargo {i + 1}</span>
              <button type="button" className={botao("fantasma", "sm", "text-verm hover:bg-verm-t")} onClick={() => onChange(cargos.filter((_, j) => j !== i))}>
                Remover
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6">
              <Campo rotulo="Nome do cargo" erro={erros[`${p}.nome`]} baixaConfianca={alertaDe(baixa, `${p}.nome`)} className="col-span-2 sm:col-span-4">
                <ComLocalizar valor={c.nome} localizar={localizar}>
                  <input className={cx(campoCls, localizar && "pr-10")} value={c.nome} onChange={(e) => muda(i, { nome: e.target.value })} />
                </ComLocalizar>
              </Campo>
              <Campo rotulo="Escolaridade" erro={erros[`${p}.escolaridade`]} baixaConfianca={alertaDe(baixa, `${p}.escolaridade`)} className="col-span-2 sm:col-span-2">
                <select className={campoCls} value={c.escolaridade} onChange={(e) => muda(i, { escolaridade: e.target.value })}>
                  <option value="">—</option>
                  {ESCOLARIDADES.map((x) => (
                    <option key={x} value={x}>
                      {ESCOLARIDADE_LABEL[x]}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Vagas" erro={erros[`${p}.vagas`]} baixaConfianca={alertaDe(baixa, `${p}.vagas`)}>
                <ComLocalizar valor={c.vagas} localizar={localizar}>
                  <input inputMode="numeric" className={cx(campoCls, "font-mono", localizar && "pr-10")} value={c.vagas} onChange={(e) => muda(i, { vagas: e.target.value })} />
                </ComLocalizar>
              </Campo>
              <Campo rotulo="Salário (R$)" erro={erros[`${p}.salario_centavos`]} baixaConfianca={alertaDe(baixa, `${p}.salario_centavos`)} className="sm:col-span-2">
                <ComLocalizar valor={c.salario} localizar={localizar}>
                  <input inputMode="decimal" placeholder="0,00" className={cx(campoCls, "font-mono", localizar && "pr-10")} value={c.salario} onChange={(e) => muda(i, { salario: e.target.value })} />
                </ComLocalizar>
              </Campo>
              <Campo rotulo="Jornada" erro={erros[`${p}.jornada`]}>
                <input className={campoCls} placeholder="40h" value={c.jornada} onChange={(e) => muda(i, { jornada: e.target.value })} />
              </Campo>
              <Campo rotulo="Área" erro={erros[`${p}.area`]} className="sm:col-span-2">
                <input list="adm-areas" className={campoCls} value={c.area} onChange={(e) => muda(i, { area: e.target.value })} />
              </Campo>
              <label className="col-span-2 flex min-h-10 items-center gap-2 self-end text-[13px] sm:col-span-2">
                <input type="checkbox" className="size-4 accent-azul" checked={c.cadastro_reserva} onChange={(e) => muda(i, { cadastro_reserva: e.target.checked })} />
                Cadastro reserva
              </label>
              {comOrigem && (
                <>
                  <Campo rotulo="Item" erro={erros[`${p}.origem.item`]} baixaConfianca={alertaDe(baixa, `${p}.origem`)}>
                    <input className={cx(campoCls, "font-mono")} placeholder="2.1" value={c.origem_item} onChange={(e) => muda(i, { origem_item: e.target.value })} />
                  </Campo>
                  <Campo rotulo="Página" erro={erros[`${p}.origem.pagina`]}>
                    <input inputMode="numeric" className={cx(campoCls, "font-mono")} value={c.origem_pagina} onChange={(e) => muda(i, { origem_pagina: e.target.value })} />
                  </Campo>
                </>
              )}
              <Campo rotulo="Requisitos" erro={erros[`${p}.requisitos`]} className="col-span-2 sm:col-span-6">
                <input className={campoCls} value={c.requisitos} onChange={(e) => muda(i, { requisitos: e.target.value })} />
              </Campo>
            </div>
            {comMaterias && (
              <div className="mt-3 rounded-lg bg-papel p-2.5">
                <p className="mb-1.5 text-[12px] font-semibold text-tx2">Matérias (nome padronizado e nº de questões)</p>
                <div className="space-y-1.5">
                  {c.materias.map((m, j) => (
                    <div key={m.k} className="flex items-start gap-1.5">
                      <div className="min-w-0 flex-1">
                        <input
                          list="adm-materias"
                          aria-label="Matéria"
                          className={cx(campoCls, "min-h-9 py-1.5", !sugestoesMaterias.includes(m.nome) && m.nome && "border-ambar/60")}
                          title={!sugestoesMaterias.includes(m.nome) && m.nome ? "Fora da lista de matérias canônicas" : undefined}
                          value={m.nome}
                          onChange={(e) => muda(i, { materias: c.materias.map((x, y) => (y === j ? { ...x, nome: e.target.value } : x)) })}
                        />
                      </div>
                      <div className="w-20">
                        <input
                          aria-label="Questões"
                          inputMode="numeric"
                          placeholder="qtd."
                          className={cx(campoCls, "min-h-9 py-1.5 font-mono")}
                          value={m.numero_questoes}
                          onChange={(e) => muda(i, { materias: c.materias.map((x, y) => (y === j ? { ...x, numero_questoes: e.target.value } : x)) })}
                        />
                        {erros[`${p}.materias.${j}.numero_questoes`] && <span className="text-[11px] text-verm">inválido</span>}
                      </div>
                      <button
                        type="button"
                        aria-label="Remover matéria"
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-tx2 hover:bg-verm-t hover:text-verm"
                        onClick={() => muda(i, { materias: c.materias.filter((_, y) => y !== j) })}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={botao("fantasma", "sm", "mt-1.5")}
                  onClick={() => muda(i, { materias: [...c.materias, { k: novaChave(), nome: "", numero_questoes: "" }] })}
                >
                  + Matéria
                </button>
              </div>
            )}
          </fieldset>
        );
      })}
      <button type="button" className={botao("sec", "sm")} onClick={() => onChange([...cargos, cargoVazio()])}>
        + Adicionar cargo
      </button>
    </div>
  );
}

export function EditorDatas({
  datas,
  onChange,
  erros,
  baixa = {},
  localizar,
}: {
  datas: DataForm[];
  onChange: (d: DataForm[]) => void;
  erros: Record<string, string>;
  baixa?: Record<string, string>;
  localizar?: Localizar;
}) {
  const muda = (i: number, p: Partial<DataForm>) => onChange(datas.map((d, j) => (j === i ? { ...d, ...p } : d)));
  return (
    <div className="space-y-2">
      {datas.length === 0 && <p className="rounded-xl border border-dashed border-linha px-4 py-3 text-[13px] text-tx2">Nenhuma data.</p>}
      {datas.map((d, i) => {
        const p = `datas.${i}`;
        const alerta = alertaDe(baixa, p);
        return (
          <div key={d.k} className={cx("grid grid-cols-2 gap-2 rounded-xl border p-2.5 sm:grid-cols-[150px_1fr_1fr_70px_64px_36px]", alerta ? "border-ambar/50 bg-marca-t/40" : "border-linha")}>
            <Campo rotulo="Tipo" erro={erros[`${p}.tipo`]} baixaConfianca={alerta}>
              <select className={campoCls} value={d.tipo} onChange={(e) => muda(i, { tipo: e.target.value })}>
                {DATE_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {DATE_TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Início" erro={erros[`${p}.inicio`]}>
              <ComLocalizar valor={isoParaBR(d.inicio)} localizar={localizar}>
                <input type="date" className={cx(campoCls, "font-mono", localizar && "pr-10")} value={d.inicio} onChange={(e) => muda(i, { inicio: e.target.value })} />
              </ComLocalizar>
            </Campo>
            <Campo rotulo="Fim" erro={erros[`${p}.fim`]}>
              <ComLocalizar valor={isoParaBR(d.fim)} localizar={localizar}>
                <input type="date" className={cx(campoCls, "font-mono", localizar && "pr-10")} value={d.fim} onChange={(e) => muda(i, { fim: e.target.value })} />
              </ComLocalizar>
            </Campo>
            <Campo rotulo="Item" erro={erros[`${p}.origem.item`]}>
              <input className={cx(campoCls, "px-2 font-mono")} value={d.origem_item} onChange={(e) => muda(i, { origem_item: e.target.value })} />
            </Campo>
            <Campo rotulo="Pág." erro={erros[`${p}.origem.pagina`]}>
              <input inputMode="numeric" className={cx(campoCls, "px-2 font-mono")} value={d.origem_pagina} onChange={(e) => muda(i, { origem_pagina: e.target.value })} />
            </Campo>
            <button
              type="button"
              aria-label={`Remover data ${i + 1}`}
              className="grid size-9 place-items-center self-end rounded-lg text-lg text-tx2 hover:bg-verm-t hover:text-verm"
              onClick={() => onChange(datas.filter((_, j) => j !== i))}
            >
              ×
            </button>
            <input
              aria-label="Descrição da data"
              placeholder="Descrição (opcional), ex.: Provas objetiva e discursiva"
              className={cx(campoCls, "col-span-2 min-h-9 py-1.5 sm:col-span-6")}
              value={d.descricao}
              onChange={(e) => muda(i, { descricao: e.target.value })}
            />
          </div>
        );
      })}
      <button type="button" className={botao("sec", "sm")} onClick={() => onChange([...datas, dataVazia()])}>
        + Adicionar data
      </button>
    </div>
  );
}
