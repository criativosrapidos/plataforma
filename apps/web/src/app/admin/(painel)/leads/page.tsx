import type { Metadata } from "next";
import Link from "next/link";
import { dataHoraBR, numeroBR } from "@aviso/shared";
import { FiltroBusca, FiltroData, FiltroSelect, FiltrosForm } from "@/components/admin/FiltrosForm";
import { Paginacao } from "@/components/admin/navegacao-tabela";
import { botao, Cabecalho, Cartao, Etiqueta, Kpi, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { listarLeads, origensDeLeads } from "@/lib/admin/consultas/negocio";
import { pct } from "@/lib/admin/formato";
import { dataParam, int, str, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Leads" };

export default async function Leads({ searchParams }: { searchParams: Promise<SP> }) {
  await exigirPainel("admin", "/admin/leads");
  const sp = await searchParams;
  const pagina = int(sp, "pagina", 1, 1);
  const porPagina = 50;
  const filtros = { q: str(sp, "q"), origem: str(sp, "origem"), de: dataParam(sp, "de"), ate: dataParam(sp, "ate") };
  const [{ itens, total, convertidos }, origens] = await Promise.all([listarLeads(filtros, { pagina, porPagina }), origensDeLeads()]);
  const exportar = new URLSearchParams(Object.entries(filtros).flatMap(([k, v]) => (v ? [[k, v]] : []))).toString();

  return (
    <>
      <Cabecalho titulo="Leads" sub="Contatos da landing e dos anúncios, para avisar no lançamento do app.">
        <a href={`/admin/exportar/leads${exportar ? `?${exportar}` : ""}`} className={botao("sec")} download>
          Exportar CSV
        </a>
      </Cabecalho>
      <div className="mb-3 grid grid-cols-2 gap-3 lg:max-w-xl">
        <Kpi rotulo="Leads" valor={numeroBR(total)} />
        <Kpi rotulo="Viraram cadastro" valor={numeroBR(convertidos)} detalhe={`${pct(total ? convertidos / total : null)} dos leads`} />
      </div>
      <div className="mb-3">
        <FiltrosForm acao="/admin/leads">
          <FiltroBusca valor={filtros.q} placeholder="Nome, e-mail ou WhatsApp" />
          <FiltroSelect nome="origem" rotulo="Origem" valor={filtros.origem} todos="Todas" opcoes={[...origens.map((o) => ({ valor: o, rotulo: o })), { valor: "sem", rotulo: "Sem origem" }]} />
          <FiltroData nome="de" rotulo="De" valor={filtros.de} />
          <FiltroData nome="ate" rotulo="até" valor={filtros.ate} />
        </FiltrosForm>
      </div>
      <Cartao corpo={false}>
        {itens.length === 0 ? (
          <Vazio titulo="Nenhum lead" texto="Os contatos do formulário da landing aparecem aqui." />
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <Th>Quando</Th>
                  <Th>Contato</Th>
                  <Th>WhatsApp</Th>
                  <Th>Origem</Th>
                  <Th>Campanha</Th>
                  <Th>Cadastro</Th>
                </tr>
              </thead>
              <tbody>
                {itens.map((l) => (
                  <Tr key={l.id}>
                    <Td className="whitespace-nowrap font-mono text-[12px]">{dataHoraBR(l.created_at)}</Td>
                    <Td className="min-w-[220px]">
                      <span className="font-semibold">{l.nome ?? "—"}</span>
                      <p className="text-[12px] text-tx2">{l.email}</p>
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[12px]">{l.whatsapp ?? "—"}</Td>
                    <Td className="text-[12.5px]">{l.origem ?? "—"}</Td>
                    <Td className="text-[12px] text-tx2">{[l.utm?.utm_source, l.utm?.utm_medium, l.utm?.utm_campaign].filter(Boolean).join(" · ") || "—"}</Td>
                    <Td>
                      {l.user_id ? (
                        <Link href={`/admin/usuarios/${l.user_id}`}>
                          <Etiqueta tom="verde">Cadastrado</Etiqueta>
                        </Link>
                      ) : (
                        <Etiqueta>Ainda não</Etiqueta>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/leads" sp={sp} pagina={pagina} porPagina={porPagina} total={total} />
          </>
        )}
      </Cartao>
    </>
  );
}
