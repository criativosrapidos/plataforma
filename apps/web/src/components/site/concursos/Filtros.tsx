"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AREAS, AREA_LABEL, BANCAS, CONTEST_STATUS, CONTEST_STATUS_LABEL, ESCOLARIDADES, ESCOLARIDADE_LABEL, UFS,
} from "@aviso/shared";
import { Selecao } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";

export type ValoresFiltro = {
  q?: string;
  uf?: string;
  escolaridade?: string;
  area?: string;
  banca?: string;
  status?: string;
  ordem?: string;
};

const ORDENS = [
  { v: "recentes", r: "Mais recentes" },
  { v: "prazo", r: "Prazo mais próximo" },
  { v: "salario", r: "Maior salário" },
  { v: "vagas", r: "Mais vagas" },
];

/**
 * Busca pública: formulário GET em /concursos com barra de busca, filtros na lateral
 * (recolhidos no celular) e os resultados (children) ao lado. Selects enviam sozinhos.
 */
export function BuscaConcursos({ valores, children }: { valores: ValoresFiltro; children: ReactNode }) {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const enviar = () => ref.current?.requestSubmit();

  // Monta a URL só com os filtros preenchidos (sem JS, o formulário GET funciona igual).
  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const qs = new URLSearchParams();
    for (const [k, v] of dados) {
      const s = String(v).trim();
      if (s && !(k === "ordem" && s === "recentes")) qs.set(k, s);
    }
    const q = qs.toString();
    router.push(q ? `/concursos?${q}` : "/concursos", { scroll: false });
  }
  const ativos = (["uf", "escolaridade", "area", "banca", "status"] as const).filter((k) => valores[k]).length;

  return (
    <form ref={ref} action="/concursos" method="get" onSubmit={aoEnviar}>
      <div role="search" className="flex gap-2">
        <label htmlFor="busca-q" className="sr-only">
          Buscar por órgão, cargo ou palavra
        </label>
        <div className="relative min-w-0 flex-1">
          <Icone nome="lupa" tamanho={20} className="pointer-events-none absolute inset-y-0 left-4 my-auto text-tx2" />
          <input
            id="busca-q"
            name="q"
            type="search"
            defaultValue={valores.q ?? ""}
            placeholder="Órgão, cargo ou palavra"
            className="min-h-13 w-full rounded-full border-[1.5px] border-linha bg-branco py-3 pr-4 pl-12 text-base outline-none placeholder:text-[#8A90A6] focus:border-azul focus:ring-4 focus:ring-azul/15"
          />
        </div>
        <Botao type="submit" className="shrink-0" tamanho="md">
          Buscar
        </Botao>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
        <div>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="filtros-concursos"
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[20px] border border-linha bg-branco px-4 font-bold lg:hidden"
          >
            <span className="inline-flex items-center gap-2">
              <Icone nome="filtro" tamanho={18} />
              Filtros e ordem
              {ativos ? <span className="grid size-6 place-items-center rounded-full bg-azul font-mono text-xs text-white">{ativos}</span> : null}
            </span>
            <Icone nome="chevronBaixo" tamanho={18} className={clsx("transition-transform", aberto && "rotate-180")} />
          </button>
          <div
            id="filtros-concursos"
            className={clsx(
              "mt-3 grid gap-4 rounded-[20px] border border-linha bg-branco p-4 lg:sticky lg:top-24 lg:mt-0 lg:block lg:space-y-4 lg:border-0 lg:bg-transparent lg:p-0",
              aberto ? "grid" : "hidden",
            )}
          >
            <p className="rotulo hidden text-tx2 lg:block">Filtrar</p>
            <Selecao rotulo="Estado" name="uf" defaultValue={valores.uf ?? ""} onChange={enviar}>
              <option value="">Todos os estados</option>
              {UFS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Selecao>
            <Selecao rotulo="Escolaridade" name="escolaridade" defaultValue={valores.escolaridade ?? ""} onChange={enviar}>
              <option value="">Todas</option>
              {ESCOLARIDADES.map((e) => (
                <option key={e} value={e}>
                  {ESCOLARIDADE_LABEL[e]}
                </option>
              ))}
            </Selecao>
            <Selecao rotulo="Área" name="area" defaultValue={valores.area ?? ""} onChange={enviar}>
              <option value="">Todas as áreas</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {AREA_LABEL[a]}
                </option>
              ))}
            </Selecao>
            <Selecao rotulo="Banca" name="banca" defaultValue={valores.banca ?? ""} onChange={enviar}>
              <option value="">Todas as bancas</option>
              {BANCAS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Selecao>
            <Selecao rotulo="Situação" name="status" defaultValue={valores.status ?? ""} onChange={enviar}>
              <option value="">Todas</option>
              {CONTEST_STATUS.map((s) => (
                <option key={s} value={s}>
                  {CONTEST_STATUS_LABEL[s]}
                </option>
              ))}
            </Selecao>
            <Selecao rotulo="Ordenar por" name="ordem" defaultValue={valores.ordem ?? "recentes"} onChange={enviar}>
              {ORDENS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.r}
                </option>
              ))}
            </Selecao>
            <noscript>
              <Botao type="submit">Aplicar filtros</Botao>
            </noscript>
            {ativos || valores.q ? (
              <Link href="/concursos" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-azul">
                <Icone nome="fechar" tamanho={16} />
                Limpar filtros
              </Link>
            ) : null}
          </div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </form>
  );
}
