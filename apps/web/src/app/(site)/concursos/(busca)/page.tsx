import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import {
  AREAS, AREA_LABEL, BANCAS, CONTEST_STATUS, CONTEST_STATUS_LABEL, ESCOLARIDADES, ESCOLARIDADE_LABEL, UFS, numeroBR,
  type Area, type ContestStatus, type Escolaridade,
} from "@aviso/shared";
import { buscarConcursos } from "@/lib/repo/concursos";
import { Container } from "@/components/site/Secao";
import { BuscaConcursos, type ValoresFiltro } from "@/components/site/concursos/Filtros";
import { CartaoConcurso } from "@/components/site/concursos/CartaoConcurso";
import { mostrarExemplos, primeiro } from "@/components/site/concursos/util";
import { BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";

export const dynamic = "force-dynamic";

type Busca = Promise<Record<string, string | string[] | undefined>>;
const POR_PAGINA = 12;
const ORDENS = ["recentes", "prazo", "salario", "vagas"] as const;

function lerFiltros(sp: Record<string, string | string[] | undefined>) {
  const so = <T extends string>(v: string | undefined, lista: readonly T[]) => (v && (lista as readonly string[]).includes(v) ? (v as T) : undefined);
  const ordem = so(primeiro(sp.ordem), ORDENS);
  const pagina = Math.max(1, Math.min(500, Number.parseInt(primeiro(sp.pagina) ?? "1", 10) || 1));
  return {
    q: primeiro(sp.q)?.slice(0, 80),
    uf: so(primeiro(sp.uf)?.toUpperCase(), UFS),
    escolaridade: so(primeiro(sp.escolaridade), ESCOLARIDADES),
    area: so(primeiro(sp.area), AREAS),
    banca: so(primeiro(sp.banca), BANCAS),
    status: so(primeiro(sp.status), CONTEST_STATUS),
    ordem,
    pagina,
  };
}

function tituloBusca(f: ReturnType<typeof lerFiltros>) {
  const partes: string[] = [];
  if (f.status) partes.push(CONTEST_STATUS_LABEL[f.status as ContestStatus].toLowerCase());
  if (f.area) partes.push(`na área ${AREA_LABEL[f.area as Area].toLowerCase()}`);
  if (f.escolaridade) partes.push(`de nível ${ESCOLARIDADE_LABEL[f.escolaridade as Escolaridade].toLowerCase()}`);
  if (f.banca) partes.push(`da banca ${f.banca}`);
  if (f.uf) partes.push(`em ${f.uf}`);
  return partes.length ? `Concursos ${partes.join(" ")}` : "Concursos públicos";
}

export async function generateMetadata({ searchParams }: { searchParams: Busca }): Promise<Metadata> {
  const f = lerFiltros(await searchParams);
  const titulo = f.q ? `Concursos: “${f.q}”` : tituloBusca(f);
  const canonico = new URLSearchParams();
  for (const k of ["uf", "escolaridade", "area", "banca", "status"] as const) if (f[k]) canonico.set(k, f[k]!);
  return {
    title: titulo,
    description: `${titulo} com vagas, salários, datas de inscrição e prova e link do edital oficial. Receba aviso no celular quando sair concurso para você.`,
    alternates: { canonical: canonico.size ? `/concursos?${canonico}` : "/concursos" },
    robots: f.q || f.pagina > 1 ? { index: false, follow: true } : undefined,
  };
}

function hrefPagina(f: ReturnType<typeof lerFiltros>, pagina: number) {
  const qs = new URLSearchParams();
  for (const k of ["q", "uf", "escolaridade", "area", "banca", "status"] as const) if (f[k]) qs.set(k, f[k]!);
  if (f.ordem && f.ordem !== "recentes") qs.set("ordem", f.ordem);
  if (pagina > 1) qs.set("pagina", String(pagina));
  const s = qs.toString();
  return s ? `/concursos?${s}` : "/concursos";
}

function Paginacao({ f, total }: { f: ReturnType<typeof lerFiltros>; total: number }) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (paginas <= 1) return null;
  const atual = Math.min(f.pagina, paginas);
  const janela = Array.from(new Set([1, atual - 1, atual, atual + 1, paginas].filter((p) => p >= 1 && p <= paginas))).sort((a, b) => a - b);
  const base = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 font-bold no-underline";
  return (
    <nav aria-label="Páginas de resultados" className="mt-10 flex flex-wrap items-center justify-between gap-4">
      <p className="font-mono text-[13px] text-tx2">
        Página {atual} de {paginas}
      </p>
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          {atual > 1 ? (
            <Link href={hrefPagina(f, atual - 1)} className={clsx(base, "border border-linha bg-branco text-tinta hover:border-tinta")} rel="prev">
              <Icone nome="chevronEsquerda" tamanho={18} />
              <span className="sr-only">Página anterior</span>
            </Link>
          ) : null}
        </li>
        {janela.map((p, i) => (
          <li key={p} className="flex items-center gap-1.5">
            {i > 0 && p - janela[i - 1] > 1 ? <span className="px-1 text-tx2">…</span> : null}
            <Link
              href={hrefPagina(f, p)}
              aria-current={p === atual ? "page" : undefined}
              className={clsx(base, p === atual ? "bg-tinta text-white" : "border border-linha bg-branco text-tinta hover:border-tinta")}
            >
              {p}
            </Link>
          </li>
        ))}
        <li>
          {atual < paginas ? (
            <Link href={hrefPagina(f, atual + 1)} className={clsx(base, "border border-linha bg-branco text-tinta hover:border-tinta")} rel="next">
              <Icone nome="chevronDireita" tamanho={18} />
              <span className="sr-only">Próxima página</span>
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}

export default async function PaginaConcursos({ searchParams }: { searchParams: Busca }) {
  const f = lerFiltros(await searchParams);
  const r = await buscarConcursos({
    q: f.q,
    uf: f.uf,
    escolaridade: f.escolaridade,
    area: f.area,
    banca: f.banca,
    status: f.status,
    ordem: f.ordem ?? "recentes",
    pagina: f.pagina,
    porPagina: POR_PAGINA,
    exemplos: mostrarExemplos() ? undefined : false,
  });
  const valores: ValoresFiltro = {
    q: f.q,
    uf: f.uf,
    escolaridade: f.escolaridade,
    area: f.area,
    banca: f.banca,
    status: f.status,
    ordem: f.ordem,
  };
  const titulo = f.q ? `Resultados para “${f.q}”` : tituloBusca(f);

  return (
    <>
      <header className="border-b border-linha">
        <Container className="pt-10 pb-8 md:pt-16 md:pb-12">
          <p className="rotulo text-azul">Busca de concursos</p>
          <h1 className="mt-3 text-[clamp(2.6rem,7vw,4.6rem)]">{titulo}</h1>
          <p className="mt-4 max-w-2xl text-lg text-tx2">
            Vagas, salários, datas e link do edital oficial. Quer saber na hora quando sair um novo? Monte seu perfil no app e a gente
            avisa.
          </p>
        </Container>
      </header>
      <section className="py-8 md:py-12">
        <Container>
          <BuscaConcursos key={JSON.stringify(valores)} valores={valores}>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-bold" aria-live="polite">
                {r.total === 0 ? "Nenhum concurso encontrado" : `${numeroBR(r.total)} ${r.total === 1 ? "concurso" : "concursos"}`}
              </p>
            </div>
            {r.itens.length ? (
              <ul className="grid gap-4 xl:grid-cols-2">
                {r.itens.map((c) => (
                  <li key={c.id} className="flex">
                    <div className="w-full">
                      <CartaoConcurso c={c} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#C7CBD6] bg-branco p-8 text-center md:p-12">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-azul-t text-azul">
                  <Icone nome="lupa" tamanho={26} />
                </span>
                <p className="mt-4 text-xl font-extrabold">Nada por aqui com esses filtros</p>
                <p className="mx-auto mt-2 max-w-md text-tx2">
                  Tente tirar algum filtro ou buscar por outra palavra. Ou deixe que a gente procure: crie um perfil e receba aviso quando
                  sair concurso para você.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <BotaoLink href="/concursos" variante="secundario">
                    Limpar filtros
                  </BotaoLink>
                  <BotaoLink href="/cadastro" iconeDepois="setaDireita">
                    Receber avisos
                  </BotaoLink>
                </div>
              </div>
            )}
            <Paginacao f={f} total={r.total} />
            <aside className="mt-10 flex flex-col gap-4 rounded-[24px] bg-tinta p-6 text-white sm:flex-row sm:items-center sm:justify-between md:p-8">
              <div>
                <p className="text-xl font-extrabold">Não fique dependendo de lembrar de olhar.</p>
                <p className="mt-1 text-[#D6DCFA]">Diga o que procura uma vez e receba notificação quando sair edital para você.</p>
              </div>
              <BotaoLink href="/cadastro" variante="marca" className="shrink-0" iconeDepois="setaDireita">
                Testar 3 dias grátis
              </BotaoLink>
            </aside>
          </BuscaConcursos>
        </Container>
      </section>
    </>
  );
}
