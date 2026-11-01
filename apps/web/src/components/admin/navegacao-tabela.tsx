// Paginação e cabeçalhos ordenáveis baseados na URL (funcionam sem JavaScript).
import Link from "next/link";
import { numeroBR } from "@aviso/shared";
import { urlCom, type SP } from "@/lib/admin/params";
import { cx, Th } from "./ui";

export function Paginacao({ base, sp, pagina, porPagina, total }: { base: string; sp: SP; pagina: number; porPagina: number; total: number }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const de = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const ate = Math.min(total, pagina * porPagina);
  const numeros = new Set([1, paginas, pagina - 1, pagina, pagina + 1].filter((n) => n >= 1 && n <= paginas));
  const lista = [...numeros].sort((a, b) => a - b);
  const link = (n: number) => urlCom(base, sp, { pagina: n === 1 ? undefined : n });
  const item = "grid min-h-9 min-w-9 place-items-center rounded-lg px-2 font-mono text-[13px]";
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[13px] text-tx2">
      <span>
        <span className="font-mono">{numeroBR(de)}</span>–<span className="font-mono">{numeroBR(ate)}</span> de{" "}
        <span className="font-mono">{numeroBR(total)}</span>
      </span>
      {paginas > 1 && (
        <div className="flex items-center gap-1">
          {pagina > 1 ? (
            <Link href={link(pagina - 1)} className={cx(item, "hover:bg-papel")} aria-label="Página anterior">
              ‹
            </Link>
          ) : (
            <span className={cx(item, "opacity-30")}>‹</span>
          )}
          {lista.map((n, i) => (
            <span key={n} className="flex items-center gap-1">
              {i > 0 && lista[i - 1] !== n - 1 && <span className="px-1">…</span>}
              <Link
                href={link(n)}
                aria-current={n === pagina ? "page" : undefined}
                className={cx(item, n === pagina ? "bg-tinta font-bold text-white" : "hover:bg-papel")}
              >
                {n}
              </Link>
            </span>
          ))}
          {pagina < paginas ? (
            <Link href={link(pagina + 1)} className={cx(item, "hover:bg-papel")} aria-label="Próxima página">
              ›
            </Link>
          ) : (
            <span className={cx(item, "opacity-30")}>›</span>
          )}
        </div>
      )}
    </nav>
  );
}

/** Cabeçalho que alterna ordenação (?ordem=campo&dir=asc|desc). */
export function ThOrdem({
  base,
  sp,
  campo,
  atual,
  dir,
  children,
  num,
  padraoDir = "desc",
}: {
  base: string;
  sp: SP;
  campo: string;
  atual: string;
  dir: "asc" | "desc";
  children: React.ReactNode;
  num?: boolean;
  padraoDir?: "asc" | "desc";
}) {
  const ativo = atual === campo;
  const prox = ativo ? (dir === "asc" ? "desc" : "asc") : padraoDir;
  return (
    <Th num={num}>
      <Link
        href={urlCom(base, sp, { ordem: campo, dir: prox, pagina: undefined })}
        className={cx("inline-flex items-center gap-1 hover:text-tinta", ativo && "text-tinta")}
        aria-sort={ativo ? (dir === "asc" ? "ascending" : "descending") : undefined}
      >
        {children}
        <span aria-hidden className={cx("text-[9px]", !ativo && "opacity-30")}>
          {ativo ? (dir === "asc" ? "▲" : "▼") : "▼"}
        </span>
      </Link>
    </Th>
  );
}
