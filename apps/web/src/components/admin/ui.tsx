// Peças visuais do painel (sem hooks: servem em Server e Client Components).
import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { Tom } from "@/lib/admin/formato";

export const cx = clsx;

type Variante = "primario" | "sec" | "perigo" | "fantasma" | "marca";
type Tamanho = "md" | "sm";

/** Classes de botão compactas para o painel (alvo de toque ≥ 44px no tamanho padrão). */
export function botao(variante: Variante = "primario", tamanho: Tamanho = "md", extra?: string) {
  return cx(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-offset-1",
    tamanho === "md" ? "min-h-11 px-4 text-sm" : "min-h-8 px-2.5 text-[13px]",
    variante === "primario" && "bg-azul text-white hover:bg-azul-2",
    variante === "sec" && "border border-linha bg-branco text-tinta hover:border-tinta/40 hover:bg-papel",
    variante === "perigo" && "bg-verm text-white hover:bg-[#B92F35]",
    variante === "fantasma" && "text-azul hover:bg-azul-t",
    variante === "marca" && "bg-marca text-tinta hover:bg-[#F5D530]",
    extra,
  );
}

export const campoCls =
  "w-full min-h-10 rounded-lg border border-linha bg-branco px-3 py-2 text-sm text-tinta outline-none transition-colors placeholder:text-tx2/60 focus:border-azul focus:ring-2 focus:ring-azul/15 disabled:bg-papel";

const TOM_CLS: Record<Tom, string> = {
  azul: "bg-azul-t text-azul",
  verde: "bg-verde-t text-verde",
  ambar: "bg-marca-t text-ambar",
  verm: "bg-verm-t text-verm",
  cinza: "bg-[#EDEFF3] text-tx2",
  roxo: "bg-[#F0E9FC] text-[#6430B8]",
  teal: "bg-[#DFF2F2] text-[#0A6B70]",
  tinta: "bg-tinta text-white",
};

export function Etiqueta({ tom = "cinza", children, titulo }: { tom?: Tom; children: ReactNode; titulo?: string }) {
  return (
    <span title={titulo} className={cx("etiqueta whitespace-nowrap uppercase", TOM_CLS[tom])}>
      {children}
    </span>
  );
}

export function Cartao({
  titulo,
  sub,
  acao,
  children,
  className,
  corpo = true,
  id,
}: {
  titulo?: ReactNode;
  sub?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
  corpo?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={cx("rounded-2xl border border-linha bg-branco", className)}>
      {(titulo || acao) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-linha px-4 py-3">
          <div className="min-w-0">
            {titulo && <h2 className="font-sans text-[15px] font-bold normal-case tracking-normal">{titulo}</h2>}
            {sub && <p className="mt-0.5 text-[13px] text-tx2">{sub}</p>}
          </div>
          {acao && <div className="flex flex-wrap items-center gap-2">{acao}</div>}
        </header>
      )}
      {corpo ? <div className="p-4">{children}</div> : children}
    </section>
  );
}

export function Cabecalho({ titulo, sub, children, voltar }: { titulo: ReactNode; sub?: ReactNode; children?: ReactNode; voltar?: { href: string; rotulo: string } }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {voltar && (
          <Link href={voltar.href} className="mb-1 inline-flex items-center gap-1 text-[13px] font-semibold text-tx2 hover:text-azul">
            <span aria-hidden>←</span> {voltar.rotulo}
          </Link>
        )}
        <h1 className="text-[34px] leading-none sm:text-[40px]">{titulo}</h1>
        {sub && <p className="mt-1.5 text-sm text-tx2">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Vazio({ titulo, texto, children }: { titulo: string; texto?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div aria-hidden className="grid size-10 place-items-center rounded-full border-2 border-dashed border-linha font-mono text-tx2">
        0
      </div>
      <p className="font-semibold">{titulo}</p>
      {texto && <p className="max-w-md text-sm text-tx2">{texto}</p>}
      {children}
    </div>
  );
}

export function Tabela({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ children, num, className }: { children?: ReactNode; num?: boolean; className?: string }) {
  return (
    <th
      scope="col"
      className={cx(
        "sticky top-0 z-[1] whitespace-nowrap border-b border-linha bg-[#FAFAF7] px-3 py-2 font-mono text-[10.5px] font-bold uppercase tracking-[.08em] text-tx2",
        num && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, num, className, colSpan }: { children?: ReactNode; num?: boolean; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cx("border-b border-linha/70 px-3 py-2 align-middle", num && "text-right font-mono tabular-nums", className)}>
      {children}
    </td>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cx("transition-colors hover:bg-[#F7F8FC]", className)}>{children}</tr>;
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("font-mono tabular-nums", className)}>{children}</span>;
}

/** Bloco de KPI (stat tile). */
export function Kpi({
  rotulo,
  valor,
  detalhe,
  href,
  alerta,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  href?: string;
  alerta?: boolean;
}) {
  const corpo = (
    <>
      <p className="text-[12.5px] font-semibold text-tx2">{rotulo}</p>
      <p className={cx("mt-1 font-mono text-[26px] font-bold leading-tight tracking-tight", alerta && "text-verm")}>{valor}</p>
      {detalhe && <p className="mt-0.5 text-[12.5px] text-tx2">{detalhe}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-linha bg-branco px-4 py-3";
  return href ? (
    <Link href={href} className={cx(cls, "transition-colors hover:border-azul/50")}>
      {corpo}
    </Link>
  ) : (
    <div className={cls}>{corpo}</div>
  );
}

export function Campo({
  rotulo,
  erro,
  ajuda,
  children,
  className,
  baixaConfianca,
}: {
  rotulo: ReactNode;
  erro?: string;
  ajuda?: ReactNode;
  children: ReactNode;
  className?: string;
  baixaConfianca?: string | false;
}) {
  return (
    <label className={cx("block min-w-0", className)}>
      <span className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-tx2">
        <span className={cx(baixaConfianca && "grifo text-tinta")}>{rotulo}</span>
        {baixaConfianca && (
          <span title={baixaConfianca} className="font-mono text-[10px] font-bold uppercase text-ambar">
            conferir
          </span>
        )}
      </span>
      {children}
      {erro && <span className="mt-1 block text-[12px] font-semibold text-verm">{erro}</span>}
      {!erro && ajuda && <span className="mt-1 block text-[12px] text-tx2">{ajuda}</span>}
    </label>
  );
}

export function Definicoes({ itens, colunas = 2 }: { itens: [ReactNode, ReactNode][]; colunas?: 1 | 2 | 3 }) {
  return (
    <dl className={cx("grid gap-x-6 gap-y-2.5 text-[13px]", colunas === 2 && "sm:grid-cols-2", colunas === 3 && "sm:grid-cols-3")}>
      {itens.map(([k, v], i) => (
        <div key={i} className="min-w-0">
          <dt className="text-[11.5px] font-semibold text-tx2">{k}</dt>
          <dd className="mt-0.5 break-words">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Aviso({ tom = "ambar", children }: { tom?: "ambar" | "verm" | "azul" | "verde"; children: ReactNode }) {
  return (
    <div
      role="status"
      className={cx(
        "rounded-xl border px-4 py-3 text-sm",
        tom === "ambar" && "border-[#F1D873] bg-marca-t text-tinta",
        tom === "verm" && "border-verm/30 bg-verm-t text-tinta",
        tom === "azul" && "border-azul/20 bg-azul-t text-tinta",
        tom === "verde" && "border-verde/25 bg-verde-t text-tinta",
      )}
    >
      {children}
    </div>
  );
}
