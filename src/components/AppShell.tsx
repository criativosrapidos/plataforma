"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { getPlan } from "@/lib/plans";
import { LogoSimbolo } from "./Logo";

const ITENS = [
  { href: "/app", label: "Painel", icone: "M3 4h18v16H3zM3 9h18M8 4v5M16 4v5" },
  { href: "/app/marcas", label: "Marcas", icone: "M4 7l8-4 8 4-8 4zM4 12l8 4 8-4M4 17l8 4 8-4" },
  { href: "/app/plano", label: "Plano", icone: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" },
  { href: "/app/conta", label: "Conta", icone: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { marcaAtiva, conta, creditosRestantes } = useStore();
  const plano = getPlan(conta.plano);

  return (
    <div className="min-h-dvh bg-off">
      <header className="sticky top-0 z-30 border-b border-linha bg-off/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/" className="grid h-9 w-9 place-items-center rounded-lg bg-amarelo" aria-label="Início">
            <LogoSimbolo className="h-5 w-5" />
          </Link>
          <Link href="/app/marcas" className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold"
              style={{ background: marcaAtiva.cores[0], color: marcaAtiva.cores[3] }}
            >
              {marcaAtiva.iniciais}
            </span>
            <span className="truncate font-extrabold">{marcaAtiva.nome}</span>
            {plano.marcas > 1 && <span className="text-cinza">⌄</span>}
          </Link>
          <Link href="/app/plano" className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold ring-1 ring-linha">
            {creditosRestantes} créditos
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white pb-safe">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {ITENS.map((i) => {
            const ativo = i.href === "/app" ? path === "/app" || path.startsWith("/app/peca") : path.startsWith(i.href);
            return (
              <li key={i.href}>
                <Link href={i.href} className="flex flex-col items-center gap-1 pt-2.5 text-[11px] font-extrabold">
                  <span className={`grid h-8 w-14 place-items-center rounded-full transition ${ativo ? "bg-amarelo" : ""}`}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                      <path d={i.icone} />
                    </svg>
                  </span>
                  <span className={ativo ? "text-preto" : "text-cinza"}>{i.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
