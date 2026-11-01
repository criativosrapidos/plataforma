"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { ItemNav } from "@/lib/admin/nav";
import { PAPEL_ROTULO } from "@/lib/admin/formato";
import { BuscaGlobal } from "./BuscaGlobal";
import { Icone } from "./icones";
import { ToastProvider } from "./Toasts";
import { cx } from "./ui";

export function Shell({
  itens,
  fila,
  usuario,
  sair,
  children,
}: {
  itens: ItemNav[];
  fila: number;
  usuario: { nome: string; email: string; role: string };
  sair: () => Promise<void>;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const [pathAnterior, setPathAnterior] = useState(pathname);
  if (pathAnterior !== pathname) {
    setPathAnterior(pathname);
    setAberto(false);
  }

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const ativo = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));
  const grupos = [...new Set(itens.map((i) => i.grupo))];

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-papel lg:pl-[232px]">
        {/* Barra lateral */}
        <aside
          className={cx(
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-tinta text-white transition-transform duration-200 lg:w-[232px] lg:translate-x-0",
            aberto ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Menu do painel"
        >
          <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4">
            <Image src="/simbolo.svg" alt="" width={28} height={28} className="size-7" />
            <div className="leading-none">
              <p className="font-display text-[19px] font-extrabold uppercase tracking-tight">Aviso Concurso</p>
              <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-marca">Painel</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-2.5 py-3">
            {grupos.map((g) => (
              <div key={g} className="mb-4">
                <p className="px-2.5 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-white/45">{g}</p>
                <ul className="space-y-0.5">
                  {itens
                    .filter((i) => i.grupo === g)
                    .map((i) => (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          aria-current={ativo(i.href) ? "page" : undefined}
                          className={cx(
                            "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors",
                            ativo(i.href) ? "bg-azul text-white" : "text-white/80 hover:bg-white/8 hover:text-white",
                          )}
                        >
                          <Icone nome={i.icone} />
                          <span className="flex-1">{i.rotulo}</span>
                          {i.badge === "fila" && fila > 0 && (
                            <span
                              className="min-w-6 rounded-full bg-marca px-1.5 text-center font-mono text-[11px] font-bold leading-5 text-tinta"
                              aria-label={`${fila} na fila`}
                            >
                              {fila > 999 ? "999+" : fila}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2.5 px-1">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/12 font-mono text-[12px] font-bold">
                {usuario.nome.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-semibold">{usuario.nome}</p>
                <p className="truncate text-[11.5px] text-white/55">
                  {PAPEL_ROTULO[usuario.role]} · {usuario.email}
                </p>
              </div>
              <form action={sair}>
                <button type="submit" className="grid size-10 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label="Sair" title="Sair">
                  <Icone nome="sair" />
                </button>
              </form>
            </div>
          </div>
        </aside>
        {aberto && <button aria-label="Fechar menu" className="fixed inset-0 z-40 bg-tinta/50 lg:hidden" onClick={() => setAberto(false)} />}

        {/* Cabeçalho */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-linha bg-branco/95 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            className="-ml-1 grid size-10 place-items-center rounded-lg hover:bg-papel lg:hidden"
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={aberto}
          >
            <Icone nome="menu" className="size-5" />
          </button>
          <BuscaGlobal admin={usuario.role === "admin"} />
          <Link
            href="/admin/revisao"
            className={cx(
              "ml-auto hidden min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-[13px] font-semibold sm:inline-flex",
              fila > 0 ? "border-[#F1D873] bg-marca-t text-tinta hover:border-ambar" : "border-linha text-tx2 hover:border-tinta/30",
            )}
            title="Extrações aguardando revisão humana"
          >
            Fila de revisão
            <span className={cx("rounded-full px-1.5 font-mono text-[12px] font-bold leading-5", fila > 0 ? "bg-marca text-tinta" : "bg-papel")}>{fila}</span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:py-6 lg:px-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
