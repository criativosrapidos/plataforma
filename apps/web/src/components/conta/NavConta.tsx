"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { api } from "@/components/ui/api-cliente";
import { Spinner } from "@/components/ui/Botao";

const ITENS: { href: string; rotulo: string; curto: string; icone: NomeIcone }[] = [
  { href: "/conta", rotulo: "Visão geral", curto: "Início", icone: "casa" },
  { href: "/conta/assinatura", rotulo: "Assinatura", curto: "Assinatura", icone: "cartao" },
  { href: "/conta/perfis", rotulo: "Perfis de busca", curto: "Perfis", icone: "filtro" },
  { href: "/conta/avisos", rotulo: "Avisos", curto: "Avisos", icone: "sino" },
  { href: "/conta/dados", rotulo: "Meus dados", curto: "Dados", icone: "usuario" },
  { href: "/conta/seguranca", rotulo: "Segurança", curto: "Segurança", icone: "cadeado" },
];

function ativo(caminho: string, href: string) {
  return href === "/conta" ? caminho === "/conta" : caminho === href || caminho.startsWith(href + "/");
}

/** Navegação da área do cliente: lateral no desktop, abas roláveis no celular. */
export function NavConta({ naoLidos = 0 }: { naoLidos?: number }) {
  const caminho = usePathname();
  const badge = (href: string) =>
    href === "/conta/avisos" && naoLidos > 0 ? (
      <span className="ml-auto grid min-w-6 place-items-center rounded-full bg-verm px-1.5 font-mono text-[11px] font-bold text-white">
        {naoLidos > 99 ? "99+" : naoLidos}
        <span className="sr-only"> não lidos</span>
      </span>
    ) : null;

  return (
    <>
      <nav aria-label="Conta" className="hidden lg:block">
        <ul className="grid gap-1">
          {ITENS.map((i) => {
            const a = ativo(caminho, i.href);
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={a ? "page" : undefined}
                  className={clsx(
                    "flex min-h-12 items-center gap-3 rounded-2xl px-4 font-bold no-underline transition-colors",
                    a ? "bg-tinta text-white" : "text-tinta hover:bg-tinta/5",
                  )}
                >
                  <Icone nome={i.icone} tamanho={20} className={a ? "text-marca" : "text-tx2"} />
                  {i.rotulo}
                  {badge(i.href)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="Conta" className="relative -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
        <ul className="flex w-max gap-1.5 pb-1">
          {ITENS.map((i) => {
            const a = ativo(caminho, i.href);
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={a ? "page" : undefined}
                  className={clsx(
                    "flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-bold whitespace-nowrap no-underline",
                    a ? "border-tinta bg-tinta text-white" : "border-linha bg-branco text-tinta",
                  )}
                >
                  <Icone nome={i.icone} tamanho={16} className={a ? "text-marca" : "text-tx2"} />
                  {i.curto}
                  {badge(i.href)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function BotaoSair({ className, compacto }: { className?: string; compacto?: boolean }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  async function sair() {
    setSaindo(true);
    try {
      await api("/api/v1/auth/sair", { corpo: {} });
    } catch {
      /* mesmo com erro de rede, leva para o login */
    }
    router.replace("/entrar?motivo=saiu");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className={clsx(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-bold text-tinta hover:bg-tinta/5 disabled:opacity-60",
        className,
      )}
      aria-label={compacto ? "Sair da conta" : undefined}
    >
      {saindo ? <Spinner className="size-[18px]" /> : <Icone nome="sair" tamanho={18} />}
      <span className={compacto ? "sr-only sm:not-sr-only" : undefined}>Sair</span>
    </button>
  );
}
