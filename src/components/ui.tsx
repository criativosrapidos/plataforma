import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Destaque: uma palavra por título, inclinada (-9°) sobre faixa amarela.
export function Destaque({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-1">
      <span className="absolute inset-x-0 bottom-[0.06em] top-[0.12em] -skew-x-[9deg] bg-amarelo" aria-hidden="true" />
      <span className="relative inline-block -skew-x-[9deg]">{children}</span>
    </span>
  );
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
const variantes = {
  primario: "bg-amarelo text-preto hover:brightness-95",
  secundario: "bg-preto text-white hover:bg-black",
  contorno: "border border-linha bg-white text-preto hover:border-preto",
  fantasma: "text-preto hover:bg-black/5",
};
const tamanhos = { md: "h-12 px-6 text-[15px]", sm: "h-10 px-4 text-sm", lg: "h-14 px-8 text-base" };

type Variante = keyof typeof variantes;
type Tamanho = keyof typeof tamanhos;

export function botao(variante: Variante = "primario", tamanho: Tamanho = "md", extra = "") {
  return `${base} ${variantes[variante]} ${tamanhos[tamanho]} ${extra}`;
}

export function Botao({
  variante = "primario",
  tamanho = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante; tamanho?: Tamanho }) {
  return <button className={botao(variante, tamanho, className)} {...props} />;
}

export function BotaoLink({
  variante = "primario",
  tamanho = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; tamanho?: Tamanho }) {
  return <Link className={botao(variante, tamanho, className)} {...props} />;
}

export function Cartao({ className = "", ...props }: ComponentProps<"div">) {
  const fundo = /(^|\s)bg-/.test(className) ? "" : "bg-white";
  return <div className={`rounded-xl border border-linha ${fundo} ${className}`} {...props} />;
}

export function Rotulo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs font-extrabold uppercase tracking-[0.14em] text-cinza ${className}`}>{children}</p>;
}
