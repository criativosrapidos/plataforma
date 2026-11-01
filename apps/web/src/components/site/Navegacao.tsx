"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";

const LINKS = [
  { href: "/como-funciona", rotulo: "Como funciona" },
  { href: "/concursos", rotulo: "Concursos" },
  { href: "/planos", rotulo: "Planos" },
  { href: "/fontes", rotulo: "Fontes" },
  { href: "/duvidas", rotulo: "Dúvidas" },
];

export function Navegacao() {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  // fecha o menu ao trocar de página
  const [caminhoAnterior, setCaminhoAnterior] = useState(caminho);
  if (caminho !== caminhoAnterior) {
    setCaminhoAnterior(caminho);
    setAberto(false);
  }

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const ativo = (href: string) => caminho === href || caminho.startsWith(href + "/");

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b bg-papel/90 backdrop-blur-md transition-colors supports-[backdrop-filter]:bg-papel/80",
        rolou || aberto ? "border-linha" : "border-transparent",
      )}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-tinta focus:px-4 focus:py-3 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <span className="sm:hidden">
          <Logo tamanho="sm" />
        </span>
        <span className="hidden sm:block">
          <Logo />
        </span>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={ativo(l.href) ? "page" : undefined}
                  className={clsx(
                    "relative inline-flex min-h-11 items-center rounded-full px-3.5 text-[15px] font-bold no-underline transition-colors hover:bg-tinta/5",
                    ativo(l.href) ? "text-azul" : "text-tinta",
                  )}
                >
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/entrar"
            className="hidden min-h-11 items-center rounded-full px-4 text-[15px] font-bold text-tinta no-underline hover:bg-tinta/5 sm:inline-flex"
          >
            Entrar
          </Link>
          <BotaoLink href="/cadastro" tamanho="sm">
            Testar grátis
          </BotaoLink>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-tinta hover:bg-tinta/5 lg:hidden"
            aria-expanded={aberto}
            aria-controls="menu-movel"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            onClick={() => setAberto((v) => !v)}
          >
            <Icone nome={aberto ? "fechar" : "menu"} tamanho={24} />
          </button>
        </div>
      </div>

      <div id="menu-movel" hidden={!aberto} className="border-t border-linha bg-papel lg:hidden">
        <nav aria-label="Menu" className="mx-auto max-w-[1200px] px-4 pt-2 pb-5 sm:px-6">
          <ul className="grid">
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-linha/70 last:border-0">
                <Link
                  href={l.href}
                  aria-current={ativo(l.href) ? "page" : undefined}
                  className={clsx(
                    "flex min-h-14 items-center justify-between font-display text-[28px] font-extrabold uppercase no-underline",
                    ativo(l.href) ? "text-azul" : "text-tinta",
                  )}
                >
                  {l.rotulo}
                  <Icone nome="chevronDireita" tamanho={22} className="text-tx2" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <BotaoLink href="/entrar" variante="secundario">
              Entrar
            </BotaoLink>
            <BotaoLink href="/cadastro">Testar grátis</BotaoLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
