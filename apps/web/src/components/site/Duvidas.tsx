import clsx from "clsx";
import { Icone } from "@/components/ui/Icone";
import type { Pergunta } from "./conteudo";

/** Lista de perguntas com <details> (funciona sem JS e com teclado). */
export function ListaDuvidas({ itens, abrirPrimeira, className }: { itens: Pergunta[]; abrirPrimeira?: boolean; className?: string }) {
  return (
    <div className={clsx("grid gap-3", className)}>
      {itens.map((d, i) => (
        <details
          key={d.p}
          open={abrirPrimeira && i === 0}
          className="group rounded-[20px] border border-linha bg-branco transition-colors open:border-tinta/25"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[20px] px-5 py-4 text-[17px] font-extrabold [&::-webkit-details-marker]:hidden">
            {d.p}
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-papel text-tinta transition-transform group-open:rotate-45 motion-reduce:transition-none">
              <Icone nome="mais" tamanho={18} strokeWidth={2.5} />
            </span>
          </summary>
          <p className="px-5 pb-5 text-[16px] leading-relaxed text-tx2">{d.r}</p>
        </details>
      ))}
    </div>
  );
}

/** JSON-LD FAQPage para as perguntas exibidas. */
export function JsonLdDuvidas({ itens }: { itens: Pergunta[] }) {
  const dados = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((d) => ({ "@type": "Question", name: d.p, acceptedAnswer: { "@type": "Answer", text: d.r } })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }} />;
}
