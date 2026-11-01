// Exportação CSV do painel (só admin). Mesmos filtros das telas, via query string.
import { dataBR } from "@aviso/shared";
import { exigirAdminApi, naoEncontrado, rota } from "@/lib/api";
import { auditar } from "@/lib/admin/audit";
import { listarAssinaturas, listarAvisos, listarLeads, listarPagamentos } from "@/lib/admin/consultas/negocio";
import { gerarCsv } from "@/lib/admin/formato";

const TZ = "America/Sao_Paulo";
const dh = (d: Date | null) => (d ? new Date(d).toLocaleString("pt-BR", { timeZone: TZ }) : "");
const reais = (c: number | null) => (c == null ? "" : (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }));

export const GET = rota(async (req: Request, ctx: { params: Promise<{ tipo: string }> }) => {
  const s = await exigirAdminApi("admin");
  const { tipo } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const p = (k: string) => q.get(k)?.trim() || undefined;
  const data = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(p(k) ?? "") ? p(k) : undefined);
  const tudo = { pagina: 1, porPagina: 0 };
  let csv: string;
  let linhas = 0;

  if (tipo === "assinaturas") {
    const { itens } = await listarAssinaturas({ status: p("status"), plano: p("plano"), ciclo: p("ciclo"), provider: p("provider"), q: p("q") }, tudo);
    linhas = itens.length;
    csv = gerarCsv(
      ["id", "nome", "email", "plano", "ciclo", "status", "metodo", "provedor", "teste_ate", "periodo_ate", "criada_em", "cancelada_em", "total_pago_reais"],
      itens.map((a) => [a.id, a.nome, a.email, a.plano, a.ciclo, a.status, a.metodo, a.provider, dh(a.trial_ends_at), dh(a.current_period_end), dh(a.created_at), dh(a.canceled_at), reais(a.pago_total)]),
    );
  } else if (tipo === "pagamentos") {
    const { itens } = await listarPagamentos({ status: p("status"), de: data("de"), ate: data("ate"), q: p("q") }, tudo);
    linhas = itens.length;
    csv = gerarCsv(
      ["id", "nome", "email", "plano", "valor_reais", "status", "metodo", "vencimento", "pago_em", "criado_em", "id_provedor"],
      itens.map((x) => [x.id, x.nome, x.email, x.plano, reais(x.valor_centavos), x.status, x.metodo, dataBR(x.vencimento), dh(x.pago_em), dh(x.created_at), x.provider_payment_id]),
    );
  } else if (tipo === "avisos") {
    const { itens } = await listarAvisos({ tipo: p("tipo"), canal: p("canal"), status: p("status"), de: data("de"), ate: data("ate"), q: p("q") }, tudo);
    linhas = itens.length;
    csv = gerarCsv(
      ["id", "criado_em", "enviado_em", "lido_em", "nome", "email", "concurso", "tipo", "canal", "status", "erro", "custo_reais", "titulo", "url_oficial"],
      itens.map((a) => [a.id, dh(a.created_at), dh(a.enviado_em), dh(a.lido_em), a.nome, a.email, a.concurso, a.tipo, a.canal, a.status, a.erro, reais(a.custo_centavos), a.titulo, a.url_oficial]),
    );
  } else if (tipo === "leads") {
    const { itens } = await listarLeads({ q: p("q"), origem: p("origem"), de: data("de"), ate: data("ate") }, tudo);
    linhas = itens.length;
    csv = gerarCsv(
      ["nome", "email", "whatsapp", "origem", "utm_source", "utm_medium", "utm_campaign", "criado_em", "virou_cadastro"],
      itens.map((l) => [l.nome, l.email, l.whatsapp, l.origem, l.utm?.utm_source, l.utm?.utm_medium, l.utm?.utm_campaign, dh(l.created_at), l.user_id ? "sim" : "não"]),
    );
  } else {
    throw naoEncontrado("Exportação desconhecida.");
  }

  await auditar(s.id, "exportar.csv", tipo, null, { linhas, filtros: Object.fromEntries(q.entries()) });
  const nome = `aviso-${tipo}-${new Date().toLocaleDateString("en-CA", { timeZone: TZ })}.csv`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nome}"`,
      "cache-control": "no-store",
    },
  });
});

