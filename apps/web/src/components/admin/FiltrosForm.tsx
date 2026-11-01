"use client";

import Form from "next/form";
import { useState, type ReactNode } from "react";
import { cx } from "./ui";

/**
 * Barra de filtros por GET (URL é a fonte da verdade). Selects, datas e checkboxes aplicam na hora;
 * campos de texto aplicam com Enter. `manter` preserva params que não estão no formulário (ex.: ordenação).
 * No celular, só a busca fica à vista; o resto abre em "Filtros".
 */
export function FiltrosForm({ acao, children, manter = {} }: { acao: string; children: ReactNode; manter?: Record<string, string | undefined> }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Form
      action={acao}
      className={cx("adm-filtros flex flex-wrap items-end gap-2", !aberto && "adm-filtros-fechado")}
      onChange={(e) => {
        const alvo = e.target as unknown as HTMLInputElement | HTMLSelectElement;
        if (alvo.tagName === "SELECT" || alvo.type === "checkbox" || alvo.type === "date" || alvo.type === "radio") {
          e.currentTarget.requestSubmit();
        }
      }}
    >
      {Object.entries(manter).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {children}
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className="adm-filtros-botao min-h-10 rounded-lg border border-linha bg-branco px-3 text-[13px] font-semibold text-tx2 sm:hidden"
      >
        {aberto ? "Menos filtros" : "Filtros"}
      </button>
    </Form>
  );
}

export function FiltroSelect({
  nome,
  rotulo,
  valor,
  opcoes,
  todos = "Todos",
}: {
  nome: string;
  rotulo: string;
  valor?: string;
  opcoes: { valor: string; rotulo: string }[];
  todos?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold text-tx2">{rotulo}</span>
      <select
        name={nome}
        defaultValue={valor ?? ""}
        className={cx("min-h-10 rounded-lg border bg-branco px-2.5 text-[13px] outline-none focus:border-azul", valor ? "border-azul/60 font-semibold" : "border-linha")}
      >
        <option value="">{todos}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FiltroBusca({ nome = "q", valor, placeholder, rotulo = "Buscar" }: { nome?: string; valor?: string; placeholder?: string; rotulo?: string }) {
  return (
    <label className="adm-busca flex min-w-[180px] flex-1 flex-col gap-1 sm:max-w-xs">
      <span className="text-[11px] font-semibold text-tx2">{rotulo}</span>
      <input
        type="search"
        name={nome}
        defaultValue={valor ?? ""}
        placeholder={placeholder}
        className="min-h-10 rounded-lg border border-linha bg-branco px-3 text-[13px] outline-none focus:border-azul"
      />
    </label>
  );
}

export function FiltroData({ nome, rotulo, valor }: { nome: string; rotulo: string; valor?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-tx2">{rotulo}</span>
      <input
        type="date"
        name={nome}
        defaultValue={valor ?? ""}
        className={cx("min-h-10 rounded-lg border bg-branco px-2.5 font-mono text-[13px] outline-none focus:border-azul", valor ? "border-azul/60" : "border-linha")}
      />
    </label>
  );
}
