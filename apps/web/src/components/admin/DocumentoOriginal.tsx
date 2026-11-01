"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dataBR, dataHoraBR } from "@aviso/shared";
import { linkSeguro } from "@/lib/admin/formato";
import { Icone } from "./icones";
import { cx } from "./ui";

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Texto do documento original com busca e destaque (o formulário usa `pedido` para localizar um valor). */
export function DocumentoOriginal({
  doc,
  pedido,
  className,
}: {
  doc: { titulo: string | null; url: string; texto: string | null; fonte: string | null; publicado_em: string | null; coletado_em: Date | string } | null;
  pedido?: { termo: string; n: number };
  className?: string;
}) {
  const [termo, setTermo] = useState("");
  const [atual, setAtual] = useState(0);
  const corpo = useRef<HTMLDivElement>(null);
  const [pedidoVisto, setPedidoVisto] = useState(pedido?.n ?? 0);
  if (pedido && pedido.n !== pedidoVisto) {
    setPedidoVisto(pedido.n);
    setTermo(pedido.termo);
    setAtual(0);
  }

  const texto = doc?.texto ?? "";
  const partes = useMemo(() => {
    const t = termo.trim();
    if (t.length < 2 || !texto) return null;
    const re = new RegExp(`(${escapar(t)})`, "gi");
    return texto.split(re);
  }, [termo, texto]);
  const total = partes ? Math.floor(partes.length / 2) : 0;

  useEffect(() => {
    if (!total || !corpo.current) return;
    const marcas = corpo.current.querySelectorAll("mark.adm-achado");
    marcas.forEach((m, i) => m.setAttribute("data-atual", i === atual ? "1" : "0"));
    marcas[atual]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [atual, total, partes]);

  if (!doc) {
    return (
      <div className={cx("grid place-items-center rounded-2xl border border-dashed border-linha bg-branco p-8 text-center text-sm text-tx2", className)}>
        Esta extração não tem documento original ligado.
      </div>
    );
  }

  const ir = (d: number) => total && setAtual((a) => (a + d + total) % total);

  return (
    <section aria-label="Documento original" className={cx("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-linha bg-branco", className)}>
      <header className="border-b border-linha px-4 py-3">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-tx2">Documento original</p>
        <h2 className="mt-0.5 font-sans text-[14px] font-bold normal-case leading-snug tracking-normal">{doc.titulo ?? "Sem título"}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-tx2">
          {doc.fonte && <span>{doc.fonte}</span>}
          <span>
            publicado <span className="font-mono">{dataBR(doc.publicado_em)}</span>
          </span>
          <span>
            coletado <span className="font-mono">{dataHoraBR(doc.coletado_em)}</span>
          </span>
          <a href={linkSeguro(doc.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-azul hover:underline">
            Abrir original <Icone nome="externo" className="size-3.5" />
          </a>
        </p>
        <form
          className="mt-2.5 flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            ir(1);
          }}
        >
          <label className="relative flex-1">
            <span className="sr-only">Procurar no documento</span>
            <Icone nome="busca" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-tx2" />
            <input
              value={termo}
              onChange={(e) => {
                setTermo(e.target.value);
                setAtual(0);
              }}
              placeholder="Procurar no documento"
              className="min-h-9 w-full rounded-lg border border-linha bg-papel pl-8 pr-2 text-[13px] outline-none focus:border-azul focus:bg-branco"
            />
          </label>
          <span className="w-16 text-center font-mono text-[12px] text-tx2" aria-live="polite">
            {termo.trim().length >= 2 ? (total ? `${atual + 1}/${total}` : "0") : ""}
          </span>
          <button type="button" onClick={() => ir(-1)} disabled={!total} className="grid size-9 place-items-center rounded-lg border border-linha disabled:opacity-40" aria-label="Ocorrência anterior">
            ‹
          </button>
          <button type="submit" disabled={!total} className="grid size-9 place-items-center rounded-lg border border-linha disabled:opacity-40" aria-label="Próxima ocorrência">
            ›
          </button>
        </form>
      </header>
      <div ref={corpo} className="adm-texto-doc min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed text-tinta">
        {!texto ? (
          <p className="font-sans text-tx2">Sem texto extraído. Abra o original pelo link acima.</p>
        ) : partes ? (
          partes.map((p, i) =>
            i % 2 === 1 ? (
              <mark key={i} className="adm-achado">
                {p}
              </mark>
            ) : (
              <span key={i}>{p}</span>
            ),
          )
        ) : (
          texto
        )}
      </div>
    </section>
  );
}
