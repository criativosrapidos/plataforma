import clsx from "clsx";
import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "./Icone";

/**
 * Etiquetas em JetBrains Mono. Tons com contraste AA:
 * texto verde/vermelho escurecidos sobre os fundos claros da marca.
 */
export type TomEtiqueta =
  | "verde"
  | "verm"
  | "marca"
  | "azul"
  | "tinta"
  | "cinza"
  | "verde-solido"
  | "verm-solido"
  | "azul-solido"
  | "roxo";

const tons: Record<TomEtiqueta, string> = {
  verde: "bg-verde-t text-[#0A6633]",
  verm: "bg-verm-t text-[#A8232A]",
  marca: "bg-marca text-tinta",
  azul: "bg-azul-t text-azul-2",
  tinta: "bg-tinta text-white",
  cinza: "bg-papel text-tx2 ring-1 ring-inset ring-linha",
  "verde-solido": "bg-[#0B7A3D] text-white",
  "verm-solido": "bg-verm text-white",
  "azul-solido": "bg-azul text-white",
  roxo: "bg-[#F0E8FB] text-[#5B2AA3]",
};

export function Etiqueta({
  tom = "cinza",
  icone,
  children,
  className,
}: {
  tom?: TomEtiqueta;
  icone?: NomeIcone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] font-mono text-[11px] font-bold uppercase leading-[1.35] tracking-[0.06em]",
        tons[tom],
        className,
      )}
    >
      {icone ? <Icone nome={icone} tamanho={12} strokeWidth={2.5} /> : null}
      {children}
    </span>
  );
}
