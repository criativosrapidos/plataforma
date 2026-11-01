import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { ALERT_TIPO_LABEL, dataBR, dataHoraBR, hojeISO, type AlertTipo } from "@aviso/shared";
import { sql } from "@/lib/db";
import { exigirLogin } from "@/lib/auth/guards";
import { CabecalhoConta, Vazio } from "@/components/conta/Blocos";
import { MarcarLidos } from "@/components/conta/MarcarLidos";
import { Etiqueta, type TomEtiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import { BotaoLink } from "@/components/ui/Botao";

export const metadata: Metadata = { title: "Avisos", robots: { index: false, follow: false } };

type Linha = {
  id: string;
  tipo: AlertTipo;
  titulo: string;
  corpo: string;
  url_oficial: string | null;
  created_at: Date;
  lido: boolean;
  slug: string | null;
  sigla: string | null;
};

const TOM: Partial<Record<AlertTipo, TomEtiqueta>> = {
  edital_publicado: "verde",
  autorizado: "roxo",
  isencao_acabando: "verm",
  inscricao_acabando: "verm",
  errata: "marca",
  prova_amanha: "verm",
  convocacao: "azul",
  cobranca_amanha: "cinza",
};

function dia(d: Date) {
  const iso = d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const h = hojeISO();
  if (iso === h) return "Hoje";
  const ontem = new Date(Date.now() - 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  if (iso === ontem) return "Ontem";
  return dataBR(iso);
}

export default async function PaginaAvisos() {
  const u = await exigirLogin("/conta/avisos");
  const avisos = await sql<Linha[]>`
    select a.id, a.tipo, a.titulo, a.corpo, a.url_oficial, a.created_at, (a.lido_em is not null) as lido,
           c.slug, coalesce(c.orgao_sigla, c.orgao) as sigla
    from alerts a left join contests c on c.id = a.contest_id
    where a.user_id = ${u.id} and a.canal = 'inapp'
    order by a.created_at desc limit 100`;
  const naoLidos = avisos.filter((a) => !a.lido).length;

  const grupos: { dia: string; itens: Linha[] }[] = [];
  for (const a of avisos) {
    const d = dia(new Date(a.created_at));
    const g = grupos.at(-1);
    if (g && g.dia === d) g.itens.push(a);
    else grupos.push({ dia: d, itens: [a] });
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <CabecalhoConta
        rotulo="Avisos"
        titulo="Histórico de avisos"
        texto="Tudo o que mandamos para você, com o link da fonte oficial. No app, cada aviso abre direto no concurso."
        acao={<MarcarLidos quantidade={naoLidos} />}
      />
      {avisos.length ? (
        <div className="grid gap-8">
          {grupos.map((g) => (
            <section key={g.dia} aria-label={g.dia}>
              <h2 className="rotulo text-tx2">{g.dia}</h2>
              <ul className="mt-3 grid gap-3">
                {g.itens.map((a) => (
                  <li
                    key={a.id}
                    className={clsx("relative rounded-[22px] border bg-branco p-5", a.lido ? "border-linha" : "border-azul/40 shadow-[0_12px_30px_-24px_rgb(31_63_209/0.6)]")}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {!a.lido ? (
                        <span className="size-2.5 rounded-full bg-azul" aria-hidden="true" />
                      ) : null}
                      <Etiqueta tom={TOM[a.tipo] ?? "azul"}>{ALERT_TIPO_LABEL[a.tipo] ?? a.tipo}</Etiqueta>
                      {a.sigla ? <span className="text-sm font-semibold text-tx2">{a.sigla}</span> : null}
                      <span className="ml-auto font-mono text-[12px] text-tx2">{dataHoraBR(a.created_at)}</span>
                      {!a.lido ? <span className="sr-only">Não lido.</span> : null}
                    </div>
                    <p className="mt-2 text-lg leading-snug font-extrabold">{a.titulo}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-tx2">{a.corpo}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                      {a.slug ? (
                        <Link href={`/concursos/${a.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-azul">
                          Ver concurso <Icone nome="setaDireita" tamanho={16} />
                        </Link>
                      ) : null}
                      {a.url_oficial ? (
                        <a href={a.url_oficial} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-azul">
                          Fonte oficial <Icone nome="externo" tamanho={16} />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <Vazio
          icone={<Icone nome="sino" tamanho={24} />}
          titulo="Nenhum aviso ainda"
          texto="Quando sair concurso que combina com seus perfis, ou um prazo dos concursos que você acompanha estiver acabando, o aviso aparece aqui e no celular."
          acao={
            <BotaoLink href="/conta/perfis" variante="secundario" icone="filtro">
              Revisar meus perfis
            </BotaoLink>
          }
        />
      )}
    </div>
  );
}
