import Link from "next/link";
import { CONTEST_STATUS_LABEL, brl, numeroBR, type ConcursoResumoDTO } from "@aviso/shared";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import { TOM_STATUS, escolaridadesTexto, local, proximaDataTexto } from "./util";

export function CartaoConcurso({ c }: { c: ConcursoResumoDTO }) {
  const prox = proximaDataTexto(c.proxima_data);
  return (
    <article className="group relative flex flex-col rounded-[24px] border border-linha bg-branco p-5 transition-[border-color,box-shadow] hover:border-tinta/30 hover:shadow-[0_20px_40px_-28px_rgb(15_21_48/0.4)] sm:p-6">
      <div className="flex flex-wrap gap-1.5">
        <Etiqueta tom={TOM_STATUS[c.status]}>{CONTEST_STATUS_LABEL[c.status]}</Etiqueta>
        <Etiqueta tom="cinza">{local(c)}</Etiqueta>
        {c.banca ? <Etiqueta tom="cinza">{c.banca}</Etiqueta> : null}
        {c.exemplo ? <Etiqueta tom="marca">Exemplo</Etiqueta> : null}
      </div>
      <p className="mt-4 font-display text-[30px] leading-none font-extrabold uppercase">{c.orgao_sigla ?? c.orgao}</p>
      <h2 className="mt-1.5 font-sans text-[17px] leading-snug font-bold tracking-normal normal-case">
        <Link href={`/concursos/${c.slug}`} className="text-tinta no-underline after:absolute after:inset-0 after:rounded-[24px] focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-azul">
          {c.titulo}
        </Link>
      </h2>
      <p className="mt-0.5 text-sm text-tx2">{c.orgao}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-linha pt-4 text-[15px] sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">Vagas</dt>
          <dd className="font-bold">
            {c.vagas_total ? numeroBR(c.vagas_total) : c.cadastro_reserva ? "CR" : "a definir"}
            {c.vagas_total && c.cadastro_reserva ? <span className="font-medium text-tx2"> + CR</span> : null}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">Salário até</dt>
          <dd className="font-bold">{c.salario_max_centavos ? brl(c.salario_max_centavos) : "a definir"}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">Escolaridade</dt>
          <dd className="font-bold">{c.escolaridades.length ? escolaridadesTexto(c.escolaridades) : "a definir"}</dd>
        </div>
      </dl>
      {prox ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-papel px-3.5 py-2.5 text-[14px]">
          <Icone nome="calendario" tamanho={16} className="shrink-0 text-azul" />
          <span className="font-bold">
            {prox.rotulo}: {prox.data}
          </span>
          <span className={prox.dias <= 3 ? "font-bold text-[#A8232A]" : "text-tx2"}>· {prox.quando}</span>
        </p>
      ) : null}
      <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-azul">
        Ver vagas, datas e matérias
        <Icone nome="setaDireita" tamanho={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}
