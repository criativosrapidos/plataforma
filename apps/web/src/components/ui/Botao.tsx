import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { Icone, type NomeIcone } from "./Icone";

export type VarianteBotao = "primario" | "secundario" | "marca" | "escuro" | "fantasma" | "perigo" | "branco";
export type TamanhoBotao = "sm" | "md" | "lg";

const variantes: Record<VarianteBotao, string> = {
  primario: "bg-azul text-white hover:bg-azul-2 shadow-[0_1px_0_rgb(15_21_48/0.15)]",
  secundario: "border-[1.5px] border-linha bg-branco text-tinta hover:border-tinta",
  marca: "bg-marca text-tinta hover:brightness-95 font-extrabold",
  escuro: "bg-tinta text-white hover:bg-[#1c2448]",
  fantasma: "text-tinta hover:bg-tinta/5",
  perigo: "bg-verm text-white hover:bg-[#b92f35]",
  branco: "bg-white text-azul hover:bg-azul-t",
};

const tamanhos: Record<TamanhoBotao, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-6 text-base",
  lg: "min-h-14 px-7 text-lg",
};

export function classesBotao(variante: VarianteBotao = "primario", tamanho: TamanhoBotao = "md", larguraTotal = false) {
  return clsx(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-bold leading-tight no-underline transition-[background-color,border-color,filter,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
    variantes[variante],
    tamanhos[tamanho],
    larguraTotal && "w-full",
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx("size-5 animate-spin motion-reduce:animate-none", className)} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type Comum = {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  larguraTotal?: boolean;
  icone?: NomeIcone;
  iconeDepois?: NomeIcone;
  children: ReactNode;
  className?: string;
};

export function Botao({
  variante,
  tamanho,
  larguraTotal,
  icone,
  iconeDepois,
  carregando,
  children,
  className,
  disabled,
  type = "button",
  ...resto
}: Comum & { carregando?: boolean } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type={type}
      className={clsx(classesBotao(variante, tamanho, larguraTotal), className)}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {carregando ? <Spinner /> : icone ? <Icone nome={icone} tamanho={18} /> : null}
      {children}
      {iconeDepois && !carregando ? <Icone nome={iconeDepois} tamanho={18} /> : null}
    </button>
  );
}

export function BotaoLink({
  variante,
  tamanho,
  larguraTotal,
  icone,
  iconeDepois,
  children,
  className,
  href,
  externo,
  ...resto
}: Comum & { href: string; externo?: boolean } & Omit<ComponentProps<"a">, "children" | "href">) {
  const cls = clsx(classesBotao(variante, tamanho, larguraTotal), className);
  const miolo = (
    <>
      {icone ? <Icone nome={icone} tamanho={18} /> : null}
      {children}
      {iconeDepois ? <Icone nome={iconeDepois} tamanho={18} /> : null}
    </>
  );
  if (externo || /^https?:/.test(href)) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...resto}>
        {miolo}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...resto}>
      {miolo}
    </Link>
  );
}
