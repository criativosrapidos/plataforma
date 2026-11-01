import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import clsx from "clsx";
import {
  CONTEST_STATUS_LABEL, DATE_TIPO_LABEL, ESCOLARIDADE_LABEL, ETAPAS_TRILHA, PLANO_INFO, TRIAL_DAYS,
  brl, dataBR, numeroBR, periodoBR, type ConcursoDetalheDTO, type Escolaridade,
} from "@aviso/shared";
import { concursoDetalhe } from "@/lib/repo/concursos";
import { Container } from "@/components/site/Secao";
import { BotoesLojas, temLojas } from "@/components/site/Lojas";
import { TOM_STATUS, areasTexto, escolaridadesTexto, local, mostrarExemplos, situacaoData } from "@/components/site/concursos/util";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { BotaoLink } from "@/components/ui/Botao";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

const carregar = cache(async (slug: string) => {
  const c = await concursoDetalhe(decodeURIComponent(slug), null);
  if (!c || (c.exemplo && !mostrarExemplos())) return null;
  return c;
});

function dominio(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function fimInscricao(c: ConcursoDetalheDTO) {
  return c.datas.find((d) => d.tipo === "inscricao")?.fim ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = await carregar(slug);
  if (!c) return { title: "Concurso não encontrado", robots: { index: false } };
  const partes = [
    c.vagas_total ? `${numeroBR(c.vagas_total)} vagas` : null,
    c.salario_max_centavos ? `salário até ${brl(c.salario_max_centavos)}` : null,
    fimInscricao(c) ? `inscrições até ${dataBR(fimInscricao(c))}` : null,
    c.banca ? `banca ${c.banca}` : null,
  ].filter(Boolean);
  const descricao = `${c.orgao}: ${partes.join(", ") || CONTEST_STATUS_LABEL[c.status].toLowerCase()}. ${c.resumo ?? ""}`.trim();
  return {
    title: `${c.titulo}: vagas, salário e datas`,
    description: descricao.slice(0, 300),
    alternates: { canonical: `/concursos/${c.slug}` },
    robots: c.exemplo ? { index: false, follow: false } : undefined,
    openGraph: { title: c.titulo, description: descricao.slice(0, 200), type: "article", url: `/concursos/${c.slug}`, siteName: "Aviso Concurso", locale: "pt_BR" },
  };
}

function JsonLd({ c }: { c: ConcursoDetalheDTO }) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const fim = fimInscricao(c);
  const vagas = c.cargos.map((r) => ({
    "@type": "JobPosting",
    title: r.nome,
    description: `<p>${(c.resumo ?? c.titulo).replace(/</g, "")}</p><p>${r.requisitos ?? ""}</p>`,
    datePosted: c.publicado_em ?? undefined,
    validThrough: fim ? `${fim}T23:59:59-03:00` : undefined,
    employmentType: "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: c.orgao, sameAs: c.url_oficial },
    ...(c.uf
      ? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: c.cidade ?? undefined, addressRegion: c.uf, addressCountry: "BR" } } }
      : { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "Brasil" } }),
    ...(r.salario_centavos
      ? { baseSalary: { "@type": "MonetaryAmount", currency: "BRL", value: { "@type": "QuantitativeValue", value: r.salario_centavos / 100, unitText: "MONTH" } } }
      : {}),
    totalJobOpenings: r.vagas ?? undefined,
    educationRequirements: r.escolaridade ? ESCOLARIDADE_LABEL[r.escolaridade] : undefined,
    directApply: false,
    url: `${base}/concursos/${c.slug}`,
  }));
  const dados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: base },
          { "@type": "ListItem", position: 2, name: "Concursos", item: `${base}/concursos` },
          { "@type": "ListItem", position: 3, name: c.titulo, item: `${base}/concursos/${c.slug}` },
        ],
      },
      ...(c.exemplo ? [] : vagas),
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }} />;
}

function Fato({ icone, rotulo, valor, detalhe }: { icone: NomeIcone; rotulo: string; valor: React.ReactNode; detalhe?: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-linha bg-branco p-4">
      <p className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">
        <Icone nome={icone} tamanho={14} />
        {rotulo}
      </p>
      <p className="mt-1.5 text-lg leading-snug font-extrabold">{valor}</p>
      {detalhe ? <p className="text-sm text-tx2">{detalhe}</p> : null}
    </div>
  );
}

function Trilha({ status }: { status: ConcursoDetalheDTO["status"] }) {
  const idx = ETAPAS_TRILHA.findIndex((e) => e.status.includes(status));
  return (
    <ol className="mt-6 grid grid-cols-6 gap-1.5" aria-label={`Etapa atual: ${CONTEST_STATUS_LABEL[status]}`}>
      {ETAPAS_TRILHA.map((e, i) => (
        <li key={e.label} className="min-w-0">
          <span className={clsx("block h-1.5 rounded-full", i <= idx ? "bg-azul" : "bg-linha")} />
          <span
            className={clsx(
              "mt-1.5 block truncate font-mono text-[10px] font-bold tracking-wide uppercase sm:text-[11px]",
              i === idx ? "text-azul" : "text-tx2",
            )}
            aria-current={i === idx ? "step" : undefined}
          >
            {e.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function formatarDiff(v: unknown) {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return dataBR(v);
  if (typeof v === "number") return numeroBR(v);
  if (v == null) return "—";
  return String(v);
}

export default async function PaginaConcurso({ params }: { params: Params }) {
  const { slug } = await params;
  const c = await carregar(slug);
  if (!c) notFound();

  const materiasGerais = c.materias.filter((m) => !m.role_id);
  const materiasPorCargo = c.cargos
    .map((r) => ({ cargo: r, materias: c.materias.filter((m) => m.role_id === r.id) }))
    .filter((g) => g.materias.length);
  const totalQuestoes = materiasGerais.reduce((s, m) => s + (m.questoes ?? 0), 0);
  const cadastroHref = `/cadastro?voltar=${encodeURIComponent(`/concursos/${c.slug}`)}`;

  return (
    <>
      <JsonLd c={c} />
      <header className="border-b border-linha">
        <Container className="pt-6 pb-10 md:pt-10 md:pb-14">
          <nav aria-label="Trilha">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-tx2">
              <li>
                <Link href="/" className="inline-flex min-h-11 items-center text-tx2 hover:text-tinta">
                  Início
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/concursos" className="inline-flex min-h-11 items-center text-tx2 hover:text-tinta">
                  Concursos
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="truncate font-semibold text-tinta">
                {c.orgao_sigla ?? c.orgao}
              </li>
            </ol>
          </nav>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Etiqueta tom={TOM_STATUS[c.status]}>{CONTEST_STATUS_LABEL[c.status]}</Etiqueta>
            <Etiqueta tom="cinza">{local(c)}</Etiqueta>
            {c.banca ? <Etiqueta tom="cinza">Banca {c.banca}</Etiqueta> : <Etiqueta tom="cinza">Banca a definir</Etiqueta>}
            {c.exemplo ? <Etiqueta tom="marca">Exemplo</Etiqueta> : null}
          </div>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.4rem,6.5vw,4.4rem)]">{c.titulo}</h1>
          <p className="mt-3 text-lg font-semibold">{c.orgao}</p>
          {c.resumo ? <p className="mt-3 max-w-3xl text-lg leading-relaxed text-tx2">{c.resumo}</p> : null}
          {c.exemplo ? (
            <p className="mt-4 max-w-3xl rounded-2xl bg-marca-t px-4 py-3 text-[15px] ring-1 ring-[#F1DE85]">
              <strong>Concurso de exemplo</strong>, usado só para demonstração. Os dados não são reais.
            </p>
          ) : null}
          <div className="max-w-3xl">
            <Trilha status={c.status} />
          </div>
          {/* no celular, o link oficial aparece logo no topo (no desktop ele fica na lateral) */}
          <div className="mt-6 flex flex-col gap-2 lg:hidden">
            <BotaoLink href={c.url_oficial} externo larguraTotal iconeDepois="externo">
              Abrir site oficial
            </BotaoLink>
            <p className="text-center font-mono text-[12px] text-tx2">Fonte oficial · {dominio(c.url_oficial)}</p>
          </div>
        </Container>
      </header>

      <Container className="grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_360px] lg:gap-12">
        <div className="min-w-0">
          <section aria-labelledby="t-resumo">
            <h2 id="t-resumo" className="sr-only">
              Resumo
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Fato
                icone="usuario"
                rotulo="Vagas"
                valor={c.vagas_total ? numeroBR(c.vagas_total) : c.cadastro_reserva ? "Cadastro reserva" : "A definir"}
                detalhe={c.vagas_total && c.cadastro_reserva ? "+ cadastro reserva" : undefined}
              />
              <Fato icone="cartao" rotulo="Salário até" valor={c.salario_max_centavos ? brl(c.salario_max_centavos) : "A definir"} />
              <Fato icone="documento" rotulo="Taxa" valor={c.taxa_centavos ? brl(c.taxa_centavos) : "A definir"} />
              <Fato icone="livro" rotulo="Escolaridade" valor={c.escolaridades.length ? escolaridadesTexto(c.escolaridades) : "A definir"} />
              <Fato icone="pasta" rotulo="Área" valor={c.areas.length ? areasTexto(c.areas) : "A definir"} />
              <Fato
                icone="globo"
                rotulo="Edital"
                valor={c.numero_edital ? `Nº ${c.numero_edital}` : "A publicar"}
                detalhe={c.publicado_em ? `Publicado em ${dataBR(c.publicado_em)}` : undefined}
              />
            </div>
          </section>

          <section aria-labelledby="t-datas" className="mt-14">
            <h2 id="t-datas" className="text-[36px] md:text-[44px]">
              Cronograma
            </h2>
            {c.datas.length ? (
              <ol className="relative mt-6 grid gap-3">
                {c.datas.map((d) => {
                  const s = situacaoData(d.inicio, d.fim);
                  return (
                    <li
                      key={d.id}
                      className={clsx(
                        "grid grid-cols-[auto_1fr] items-start gap-4 rounded-[20px] border bg-branco p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center",
                        s.passou ? "border-linha opacity-70" : "border-linha",
                      )}
                    >
                      <span
                        className={clsx(
                          "grid size-12 place-items-center rounded-2xl",
                          d.tipo === "prova" ? "bg-azul text-white" : s.passou ? "bg-papel text-tx2" : "bg-azul-t text-azul",
                        )}
                      >
                        <Icone nome={d.tipo === "prova" ? "documento" : d.tipo === "isencao" ? "cartao" : "calendario"} tamanho={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-extrabold">{d.descricao ?? DATE_TIPO_LABEL[d.tipo]}</p>
                        <p className="font-mono text-[14px] font-bold">{periodoBR(d.inicio, d.fim)}</p>
                        {d.fonte_item || d.fonte_pagina ? (
                          <p className="mt-0.5 text-[13px] text-tx2">
                            Edital{d.fonte_item ? `, item ${d.fonte_item}` : ""}
                            {d.fonte_pagina ? `, página ${d.fonte_pagina}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <Etiqueta tom={s.tom} className="col-start-2 justify-self-start sm:col-start-3">
                        {s.texto}
                      </Etiqueta>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-4 rounded-[20px] border border-dashed border-[#C7CBD6] bg-branco p-5 text-tx2">
                As datas ainda não saíram. Quem acompanha no app recebe aviso assim que o edital for publicado.
              </p>
            )}
          </section>

          <section aria-labelledby="t-cargos" className="mt-14">
            <h2 id="t-cargos" className="text-[36px] md:text-[44px]">
              Cargos e salários
            </h2>
            <ul className="mt-6 grid gap-3">
              {c.cargos.map((r) => (
                <li key={r.id} className="rounded-[20px] border border-linha bg-branco p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="min-w-0 text-lg leading-snug font-extrabold">{r.nome}</p>
                    {r.salario_centavos ? (
                      <p className="font-mono text-lg font-bold whitespace-nowrap text-azul">{brl(r.salario_centavos)}</p>
                    ) : null}
                  </div>
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
                    <div className="flex gap-1.5">
                      <dt className="text-tx2">Escolaridade:</dt>
                      <dd className="font-bold">{r.escolaridade ? ESCOLARIDADE_LABEL[r.escolaridade as Escolaridade] : "a definir"}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-tx2">Vagas:</dt>
                      <dd className="font-bold">
                        {r.vagas != null ? numeroBR(r.vagas) : "a definir"}
                        {r.cadastro_reserva ? " + CR" : ""}
                      </dd>
                    </div>
                    {r.jornada ? (
                      <div className="flex gap-1.5">
                        <dt className="text-tx2">Jornada:</dt>
                        <dd className="font-bold">{r.jornada}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {r.requisitos ? <p className="mt-2 text-[15px] text-tx2">{r.requisitos}</p> : null}
                </li>
              ))}
            </ul>
          </section>

          {c.materias.length ? (
            <section aria-labelledby="t-materias" className="mt-14">
              <h2 id="t-materias" className="text-[36px] md:text-[44px]">
                Matérias
              </h2>
              <p className="mt-2 text-tx2">
                Do conteúdo programático do edital{totalQuestoes ? `, ${totalQuestoes} questões no total` : ""}. No app, elas entram em
                Matérias em comum com os seus outros concursos.
              </p>
              {materiasGerais.length ? (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {materiasGerais.map((m) => (
                    <li key={m.subject_id} className="flex items-center justify-between gap-3 rounded-2xl border border-linha bg-branco px-4 py-3">
                      <span className="font-bold">{m.nome}</span>
                      {m.questoes ? <span className="font-mono text-[13px] font-bold whitespace-nowrap text-tx2">{m.questoes} questões</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {materiasPorCargo.map((g) => (
                <div key={g.cargo.id} className="mt-6">
                  <p className="font-extrabold">{g.cargo.nome}</p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {g.materias.map((m) => (
                      <li key={m.subject_id} className="flex items-center justify-between gap-3 rounded-2xl border border-linha bg-branco px-4 py-3">
                        <span className="font-bold">{m.nome}</span>
                        {m.questoes ? <span className="font-mono text-[13px] font-bold text-tx2">{m.questoes} questões</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}

          {c.versoes.length ? (
            <section aria-labelledby="t-versoes" className="mt-14">
              <h2 id="t-versoes" className="text-[36px] md:text-[44px]">
                Erratas e mudanças
              </h2>
              <ul className="mt-6 grid gap-3">
                {c.versoes.map((v) => (
                  <li key={v.versao} className="rounded-[20px] border border-linha bg-branco p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Etiqueta tom="marca">Versão {v.versao}</Etiqueta>
                      <span className="font-mono text-[13px] text-tx2">{dataBR(v.created_at)}</span>
                    </div>
                    {v.resumo ? <p className="mt-2 font-bold">{v.resumo}</p> : null}
                    {v.diff.length ? (
                      <ul className="mt-2 grid gap-1 text-[15px]">
                        {v.diff.map((d, i) => (
                          <li key={i}>
                            <span className="text-tx2">{DATE_TIPO_LABEL[d.campo as keyof typeof DATE_TIPO_LABEL] ?? d.campo}:</span>{" "}
                            <s className="text-tx2">{formatarDiff(d.antes)}</s> <Icone nome="setaDireita" tamanho={14} className="inline" />{" "}
                            <strong>{formatarDiff(d.depois)}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="grid content-start gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[24px] bg-azul p-6 text-white">
            <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-marca uppercase">Fonte oficial</p>
            <p className="mt-2 text-xl leading-snug font-extrabold">Confira tudo no edital oficial</p>
            <p className="mt-1 font-mono text-[13px] break-all text-[#D6DCFA]">{dominio(c.url_oficial)}</p>
            <BotaoLink href={c.url_oficial} externo variante="branco" larguraTotal className="mt-5" iconeDepois="externo">
              Abrir site oficial
            </BotaoLink>
            <p className="mt-4 flex gap-2 text-[13.5px] leading-snug text-[#D6DCFA]">
              <Icone nome="escudo" tamanho={16} className="mt-0.5 shrink-0 text-marca" />
              Só pague a taxa no site da banca organizadora. Desconfie de outros links.
            </p>
          </div>
          <div className="rounded-[24px] bg-tinta p-6 text-white">
            <p className="font-display text-[30px] leading-none font-extrabold uppercase">
              Acompanhe no <span className="text-marca">app</span>
            </p>
            <ul className="mt-4 grid gap-2 text-[15px] text-[#D6DCFA]">
              {[
                "Lembrete antes da isenção e da inscrição acabarem",
                "Errata? A agenda se atualiza sozinha",
                "Contagem regressiva e checklist da prova",
                "Matérias em comum com seus outros concursos",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Icone nome="check" tamanho={16} strokeWidth={3} className="mt-1 shrink-0 text-marca" />
                  {t}
                </li>
              ))}
            </ul>
            <BotaoLink href={cadastroHref} variante="marca" larguraTotal className="mt-5" iconeDepois="setaDireita">
              Testar {TRIAL_DAYS} dias grátis
            </BotaoLink>
            {temLojas ? <BotoesLojas className="mt-3" claro tamanho="md" /> : null}
            <p className="mt-3 text-[13px] text-white/70">
              Depois, {brl(PLANO_INFO.aviso.precoMensalCentavos)} por mês. Cancele quando quiser.
            </p>
          </div>
        </aside>
      </Container>
    </>
  );
}
