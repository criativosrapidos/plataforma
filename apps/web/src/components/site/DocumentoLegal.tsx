import type { ReactNode } from "react";
import { Container } from "./Secao";

export type SecaoLegal = { id: string; titulo: string; conteudo: ReactNode };

/** Marca trechos que precisam de revisão jurídica antes do lançamento. */
export function Revisar({ children = "revisar com advogado" }: { children?: ReactNode }) {
  return (
    <mark className="rounded bg-marca-t px-1 font-mono text-[12px] font-bold text-ambar ring-1 ring-[#F1DE85]">[{children}]</mark>
  );
}

/** Página de texto longo (termos, privacidade) com sumário fixo no desktop. */
export function DocumentoLegal({
  rotulo,
  titulo,
  atualizado,
  resumo,
  secoes,
}: {
  rotulo: string;
  titulo: string;
  atualizado: string;
  resumo: ReactNode;
  secoes: SecaoLegal[];
}) {
  return (
    <>
      <header className="border-b border-linha">
        <Container className="pt-12 pb-12 md:pt-20 md:pb-16">
          <p className="rotulo text-azul">{rotulo}</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,5rem)]">{titulo}</h1>
          <p className="mt-4 font-mono text-[13px] text-tx2">Última atualização: {atualizado}</p>
          <div className="mt-6 max-w-3xl rounded-[20px] border border-linha bg-branco p-5 text-[16px] leading-relaxed md:p-6">{resumo}</div>
        </Container>
      </header>
      <Container className="grid gap-10 py-12 md:py-16 lg:grid-cols-[260px_1fr] lg:gap-16">
        <nav aria-label="Sumário" className="lg:sticky lg:top-28 lg:self-start">
          <p className="rotulo text-tx2">Sumário</p>
          <ol className="mt-3 grid gap-0.5 text-[15px]">
            {secoes.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex min-h-10 items-center gap-2 font-semibold text-tinta no-underline hover:text-azul">
                  <span className="w-6 font-mono text-[12px] text-tx2">{String(i + 1).padStart(2, "0")}</span>
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="max-w-[720px] text-[17px] leading-[1.7] text-tinta/90 [&_a]:font-semibold [&_a]:text-azul [&_li]:mt-1.5 [&_p]:mt-4 [&_strong]:text-tinta [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
          {secoes.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-linha pb-10 not-first:pt-10 last:border-0">
              <h2 className="flex items-baseline gap-3 text-[32px] md:text-[38px]">
                <span className="font-mono text-base font-bold text-azul">{String(i + 1).padStart(2, "0")}</span>
                {s.titulo}
              </h2>
              {s.conteudo}
            </section>
          ))}
        </article>
      </Container>
    </>
  );
}
