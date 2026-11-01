import clsx from "clsx";
import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "./Icone";

type Tom = "info" | "sucesso" | "erro" | "atencao" | "marca";

const estilos: Record<Tom, { caixa: string; icone: NomeIcone; corIcone: string }> = {
  info: { caixa: "bg-azul-t border-[#C9D3F7] text-tinta", icone: "info", corIcone: "text-azul" },
  sucesso: { caixa: "bg-verde-t border-[#BFE3CD] text-tinta", icone: "check", corIcone: "text-[#0A6633]" },
  erro: { caixa: "bg-verm-t border-[#F3C3C5] text-tinta", icone: "alerta", corIcone: "text-[#A8232A]" },
  atencao: { caixa: "bg-marca-t border-[#F1DE85] text-tinta", icone: "alerta", corIcone: "text-ambar" },
  marca: { caixa: "bg-marca border-marca text-tinta", icone: "sino", corIcone: "text-tinta" },
};

/** Caixa de mensagem. Erros usam role="alert"; o resto, role="status". */
export function Aviso({
  tom = "info",
  titulo,
  children,
  acao,
  className,
  icone,
}: {
  tom?: Tom;
  titulo?: ReactNode;
  children?: ReactNode;
  acao?: ReactNode;
  className?: string;
  icone?: NomeIcone;
}) {
  const e = estilos[tom];
  return (
    <div
      role={tom === "erro" ? "alert" : "status"}
      className={clsx("flex gap-3 rounded-2xl border px-4 py-3.5 text-[15px] leading-relaxed", e.caixa, className)}
    >
      <Icone nome={icone ?? e.icone} tamanho={20} className={clsx("mt-0.5 shrink-0", e.corIcone)} />
      <div className="min-w-0 flex-1">
        {titulo ? <p className="font-bold">{titulo}</p> : null}
        {children ? <div className={clsx(titulo && "mt-0.5", "text-tinta/85")}>{children}</div> : null}
        {acao ? <div className="mt-3">{acao}</div> : null}
      </div>
    </div>
  );
}
