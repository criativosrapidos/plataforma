"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { CONTEST_STATUS_LABEL, type ContestStatus } from "@aviso/shared";
import { buscarGlobalAcao } from "@/lib/admin/acoes/sessao";
import type { ResultadoBusca } from "@/lib/admin/consultas/busca";
import { PAPEL_ROTULO } from "@/lib/admin/formato";
import { Icone } from "./icones";
import { cx } from "./ui";

/** Busca global: concursos (nome, órgão, sigla, edital, banca) e usuários (nome, e-mail). Atalho: "/". */
export function BuscaGlobal({ admin }: { admin: boolean }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<ResultadoBusca | null>(null);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [, iniciar] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const listaId = useId();

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) return;
    const id = setTimeout(() => {
      iniciar(async () => {
        try {
          setRes(await buscarGlobalAcao(t));
          setAtivo(-1);
        } catch {
          setRes(null);
        }
      });
    }, 220);
    return () => clearTimeout(id);
  }, [q]);

  const itens = [
    ...(res?.concursos ?? []).map((c) => ({ href: `/admin/concursos/${c.id}`, chave: c.id })),
    ...(res?.usuarios ?? []).map((u) => ({ href: `/admin/usuarios/${u.id}`, chave: u.id })),
  ];
  const mostrar = aberto && q.trim().length >= 2 && res;

  function ir(href: string) {
    setAberto(false);
    setQ("");
    setRes(null);
    router.push(href);
  }

  return (
    <div className="relative w-full max-w-xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (ativo >= 0 && itens[ativo]) return ir(itens[ativo].href);
          if (q.trim()) ir(`/admin/busca?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <label className="relative block">
          <span className="sr-only">Buscar no painel</span>
          <Icone nome="busca" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tx2" />
          <input
            ref={ref}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAberto(true);
            }}
            onFocus={() => setAberto(true)}
            onBlur={() => setTimeout(() => setAberto(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setAtivo((a) => Math.min(itens.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setAtivo((a) => Math.max(-1, a - 1));
              } else if (e.key === "Escape") {
                setAberto(false);
                ref.current?.blur();
              }
            }}
            role="combobox"
            aria-expanded={!!mostrar}
            aria-controls={listaId}
            aria-autocomplete="list"
            placeholder={admin ? "Buscar concurso, órgão, usuário ou e-mail" : "Buscar concurso ou órgão"}
            className="min-h-10 w-full rounded-lg border border-linha bg-papel pl-9 pr-10 text-[13.5px] outline-none placeholder:text-tx2/70 focus:border-azul focus:bg-branco"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-linha bg-branco px-1.5 font-mono text-[11px] text-tx2 sm:block">
            /
          </kbd>
        </label>
      </form>
      {mostrar && (
        <div id={listaId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-linha bg-branco shadow-[0_12px_40px_rgba(15,21,48,.16)]">
          {itens.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-tx2">Nada encontrado para “{q.trim()}”.</p>
          ) : (
            <>
              {res.concursos.length > 0 && <p className="px-3 pt-2.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-tx2">Concursos</p>}
              {res.concursos.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/admin/concursos/${c.id}`}
                  role="option"
                  aria-selected={ativo === i}
                  onClick={() => setAberto(false)}
                  className={cx("flex items-center justify-between gap-3 px-3 py-2 text-[13px]", ativo === i ? "bg-azul-t" : "hover:bg-papel")}
                >
                  <span className="min-w-0 truncate">
                    <b className="font-semibold">{c.titulo}</b> <span className="text-tx2">· {c.orgao}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-tx2">
                    {CONTEST_STATUS_LABEL[c.status as ContestStatus] ?? c.status}
                    {!c.publicado && " · rascunho"}
                  </span>
                </Link>
              ))}
              {res.usuarios.length > 0 && <p className="border-t border-linha px-3 pt-2.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-tx2">Usuários</p>}
              {res.usuarios.map((u, j) => {
                const i = res.concursos.length + j;
                return (
                  <Link
                    key={u.id}
                    href={`/admin/usuarios/${u.id}`}
                    role="option"
                    aria-selected={ativo === i}
                    onClick={() => setAberto(false)}
                    className={cx("flex items-center justify-between gap-3 px-3 py-2 text-[13px]", ativo === i ? "bg-azul-t" : "hover:bg-papel")}
                  >
                    <span className="min-w-0 truncate">
                      <b className="font-semibold">{u.nome}</b> <span className="text-tx2">· {u.email}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-tx2">{PAPEL_ROTULO[u.role]}</span>
                  </Link>
                );
              })}
            </>
          )}
          <Link
            href={`/admin/busca?q=${encodeURIComponent(q.trim())}`}
            onClick={() => setAberto(false)}
            className="block border-t border-linha bg-[#FAFAF7] px-3 py-2 text-[12.5px] font-semibold text-azul hover:underline"
          >
            Ver todos os resultados →
          </Link>
        </div>
      )}
    </div>
  );
}
