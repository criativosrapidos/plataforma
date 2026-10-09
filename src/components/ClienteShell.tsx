"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCliente } from "@/lib/cliente-store";
import { MARCAS } from "@/lib/mock";
import { PACOTES } from "@/lib/pacotes";
import { LogoSimbolo } from "./Logo";

const ITENS = [
  { href: "/cliente", label: "Início", icone: "M3 11l9-8 9 8M5 9.5V21h14V9.5" },
  { href: "/cliente/entregas", label: "Entregas", icone: "M4 4h16v16H4zM4 9h16M9 4v16" },
  { href: "/cliente/calendario", label: "Calendário", icone: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" },
  { href: "/cliente/marca", label: "Marca", icone: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" },
];

export function ClienteShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { cliente, contar } = useCliente();
  const marca = MARCAS.find((m) => m.id === cliente.marcaId)!;
  const pacote = PACOTES.find((p) => p.id === cliente.pacote)!;
  const aprovar = contar("aprovar");

  return (
    <div className="min-h-dvh bg-off">
      <header className="sticky top-0 z-30 border-b border-linha bg-off/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/" className="grid h-9 w-9 place-items-center rounded-lg bg-amarelo" aria-label="Site">
            <LogoSimbolo className="h-5 w-5" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold"
              style={{ background: marca.cores[0], color: marca.cores[3] }}
            >
              {marca.iniciais}
            </span>
            <span className="truncate font-extrabold">{cliente.marca}</span>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold ring-1 ring-linha">Pacote {pacote.nome}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white pb-safe">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {ITENS.map((i) => {
            const ativo = i.href === "/cliente" ? path === "/cliente" : path.startsWith(i.href);
            return (
              <li key={i.href}>
                <Link href={i.href} className="relative flex flex-col items-center gap-1 pt-2.5 text-[11px] font-extrabold">
                  <span className={`grid h-8 w-14 place-items-center rounded-full transition ${ativo ? "bg-amarelo" : ""}`}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                      <path d={i.icone} />
                    </svg>
                  </span>
                  {i.href === "/cliente/entregas" && aprovar > 0 && (
                    <span className="absolute right-[calc(50%-26px)] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-preto px-1 text-[10px] text-white">
                      {aprovar}
                    </span>
                  )}
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
