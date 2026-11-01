import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { DATE_TIPO_LABEL, dataCurtaBR, diasEntre, hojeISO, periodoBR, somarDias } from "@aviso/shared";
import { sql } from "@/lib/db";
import { exigirLogin } from "@/lib/auth/guards";
import { acessoDoUsuario, assinaturaAtual, jaUsouTeste } from "@/lib/repo/assinaturas";
import { agenda } from "@/lib/repo/agenda";
import { resumoAssinatura } from "@/components/conta/status";
import { CabecalhoConta, Painel, Vazio } from "@/components/conta/Blocos";
import { BotoesLojas, temLojas } from "@/components/site/Lojas";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { BotaoLink } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { param } from "@/components/ui/destino";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false, follow: false } };

type Busca = Promise<Record<string, string | string[] | undefined>>;

/** "em 5 dias" para eventos; "acaba em 2 dias" para prazos que já estão abertos. */
function quando(dias: number, prazoAberto: boolean) {
  const base = dias <= 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;
  return prazoAberto ? `acaba ${base}` : base;
}

export default async function VisaoGeral({ searchParams }: { searchParams: Busca }) {
  const u = await exigirLogin("/conta");
  const sp = await searchParams;
  const h = hojeISO();
  const [assinatura, acesso, usouTeste, compromissos, [cont]] = await Promise.all([
    assinaturaAtual(u.id),
    acessoDoUsuario(u.id),
    jaUsouTeste(u.id),
    agenda(u.id, h, somarDias(h, 60)),
    sql<{ perfis: number; acompanhando: number; naolidos: number }[]>`
      select (select count(*)::int from profiles where user_id = ${u.id}) as perfis,
             (select count(*)::int from follows where user_id = ${u.id}) as acompanhando,
             (select count(*)::int from alerts where user_id = ${u.id} and canal = 'inapp' and lido_em is null) as naolidos`,
  ]);
  const resumo = resumoAssinatura(assinatura, acesso, usouTeste);

  // Próximos prazos: o que ainda vai acontecer (ou está aberto), pela data que importa (fim do prazo ou dia da prova).
  const prazos = compromissos
    .map((c) => ({ ...c, alvo: (c.fim ?? c.inicio)! }))
    .filter((c) => c.alvo >= h)
    .sort((a, b) => a.alvo.localeCompare(b.alvo))
    .slice(0, 6);
  const slugs = prazos.length
    ? new Map(
        (await sql<{ id: string; slug: string }[]>`select id, slug from contests where id = any(${[...new Set(prazos.map((p) => p.contest_id))]}::uuid[])`).map(
          (r) => [r.id, r.slug],
        ),
      )
    : new Map<string, string>();

  const primeiro = u.nome.split(" ")[0];
  const atalhos: { href: string; icone: NomeIcone; titulo: string; texto: string }[] = [
    { href: "/conta/perfis", icone: "filtro", titulo: "Perfis de busca", texto: cont.perfis ? `${cont.perfis} ${cont.perfis === 1 ? "perfil" : "perfis"}` : "Nenhum ainda" },
    { href: "/conta/avisos", icone: "sino", titulo: "Avisos", texto: cont.naolidos ? `${cont.naolidos} não ${cont.naolidos === 1 ? "lido" : "lidos"}` : "Tudo lido" },
    { href: "/concursos", icone: "lupa", titulo: "Buscar concursos", texto: "Vagas, datas e editais" },
    { href: "/conta/dados", icone: "usuario", titulo: "Meus dados", texto: "WhatsApp, LGPD" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <CabecalhoConta rotulo="Minha conta" titulo={<>Olá, {primeiro}</>} texto="Assinatura, perfis de busca e seus dados. Os avisos e a agenda chegam pelo app." />

      {param(sp.senha) === "redefinida" ? <Aviso tom="sucesso">Senha alterada. Você está conectado e as outras sessões foram encerradas.</Aviso> : null}

      <section
        aria-labelledby="t-plano"
        className={clsx(
          "relative overflow-hidden rounded-[28px] p-6 sm:p-8",
          resumo.agir ? "bg-marca text-tinta" : "bg-tinta text-white",
        )}
      >
        <div aria-hidden="true" className={clsx("absolute -top-20 -right-20 size-64 rounded-full border-[28px]", resumo.agir ? "border-tinta/[0.06]" : "border-white/[0.05]")} />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <Etiqueta tom={resumo.agir ? "tinta" : resumo.tom === "azul" ? "marca" : resumo.tom}>{resumo.etiqueta}</Etiqueta>
            <h2 id="t-plano" className="mt-4 text-[clamp(2rem,5vw,3rem)]">
              {resumo.titulo}
            </h2>
            <p className={clsx("mt-2 text-[16px] leading-relaxed", resumo.agir ? "text-tinta/85" : "text-[#D6DCFA]")}>{resumo.texto}</p>
          </div>
          {resumo.agir && !resumo.viva ? (
            <BotaoLink href={acesso.liberado ? "/conta/assinatura" : "/assinar"} variante="escuro" tamanho="lg" iconeDepois="setaDireita" className="shrink-0">
              {usouTeste ? "Escolher plano" : "Começar teste grátis"}
            </BotaoLink>
          ) : (
            <BotaoLink href="/conta/assinatura" variante={resumo.agir ? "escuro" : "marca"} className="shrink-0" iconeDepois="setaDireita">
              Gerenciar assinatura
            </BotaoLink>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Painel
          id="prazos"
          titulo="Próximos prazos"
          descricao={cont.acompanhando ? `Dos ${cont.acompanhando} concursos que você acompanha, nos próximos 60 dias.` : undefined}
        >
          {prazos.length ? (
            <ul className="grid grid-cols-1 gap-2">
              {prazos.map((p) => {
                const d = diasEntre(h, p.alvo);
                const slug = slugs.get(p.contest_id);
                const conteudo = (
                  <>
                    <span className="w-1.5 self-stretch rounded-r-full" style={{ background: p.cor }} aria-hidden="true" />
                    <span className="w-12 shrink-0 text-center font-mono leading-tight">
                      <span className="block text-lg font-bold">{dataCurtaBR(p.alvo).slice(0, 2)}</span>
                      <span className="block text-[10px] font-bold tracking-wider text-tx2 uppercase">
                        {new Date(`${p.alvo}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">
                        {DATE_TIPO_LABEL[p.tipo]} · {p.concurso}
                      </span>
                      <span className="block truncate text-sm text-tx2">
                        {p.inicio && p.fim && p.inicio !== p.fim ? `${periodoBR(p.inicio, p.fim)}` : (p.descricao ?? periodoBR(p.inicio, p.fim))}
                      </span>
                    </span>
                    <Etiqueta tom={d <= 2 ? "verm" : "cinza"} className="shrink-0">
                      {quando(d, !!p.inicio && !!p.fim && p.inicio !== p.fim && p.inicio <= h)}
                    </Etiqueta>
                  </>
                );
                return (
                  <li key={p.id}>
                    {slug ? (
                      <Link
                        href={`/concursos/${slug}`}
                        className="flex min-h-14 items-center gap-3 overflow-hidden rounded-2xl border border-linha py-2 pr-3 text-tinta no-underline hover:border-tinta/30"
                      >
                        {conteudo}
                      </Link>
                    ) : (
                      <div className="flex min-h-14 items-center gap-3 overflow-hidden rounded-2xl border border-linha py-2 pr-3">{conteudo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vazio
              icone={<Icone nome="calendario" tamanho={24} />}
              titulo={cont.acompanhando ? "Nenhum prazo nos próximos 60 dias" : "Você ainda não acompanha concursos"}
              texto={
                cont.acompanhando
                  ? "Quando sair data nova, ela aparece aqui e na agenda do app."
                  : "No app, toque em Acompanhar num concurso para ver isenção, inscrição e prova aqui e na agenda."
              }
              acao={
                <BotaoLink href="/concursos" variante="secundario" icone="lupa">
                  Buscar concursos
                </BotaoLink>
              }
            />
          )}
        </Painel>

        <div className="grid content-start gap-6">
          <Painel titulo="A experiência principal é o app" descricao="Notificação na hora, agenda com uma cor por concurso, matérias em comum e checklist. Entre com este mesmo e-mail.">
            {temLojas ? (
              <BotoesLojas tamanho="md" />
            ) : (
              <BotaoLink href="/baixar" variante="secundario" icone="celular">
                Ver o app
              </BotaoLink>
            )}
          </Painel>
          <ul className="grid grid-cols-2 gap-3">
            {atalhos.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="flex h-full min-h-28 flex-col rounded-[20px] border border-linha bg-branco p-4 text-tinta no-underline transition-colors hover:border-tinta/30"
                >
                  <Icone nome={a.icone} tamanho={20} className="text-azul" />
                  <span className="mt-auto pt-3 font-bold leading-snug">{a.titulo}</span>
                  <span className="text-sm text-tx2">{a.texto}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
