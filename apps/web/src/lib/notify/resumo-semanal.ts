import "server-only";
import { sql } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import { appUrl, configNumero, semanaISO } from "@/lib/pipeline/config";
import {
  brl, calcularAcesso, casarPerfil, dataBR, hojeISO, somarDias, DATE_TIPO_LABEL,
  type AssinaturaLike, type ConcursoParaMatch, type DateTipo, type PerfilBusca,
} from "@aviso/shared";

/**
 * Resumo semanal por e-mail (quem deixou "resumo por e-mail" ligado e tem acesso):
 * concursos novos que casam com os perfis, prazos dos próximos 14 dias e erratas da semana.
 * Um por pessoa por semana (email_resumos); semana sem nada não manda e-mail.
 */

interface Novo {
  id: string;
  titulo: string;
  url_oficial: string;
  vagas_total: number | null;
  salario_max_centavos: number | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function jobResumoSemanal(agora: Date = new Date()) {
  const hoje = hojeISO(agora);
  const semana = semanaISO(hoje);
  const pessoas = await sql<{ id: string; nome: string; email: string }[]>`
    select u.id, u.nome, u.email::text as email from users u join user_settings s on s.user_id = u.id
    where s.email_resumo and u.deleted_at is null
      and not exists (select 1 from email_resumos r where r.user_id = u.id and r.semana = ${semana})`;
  const candidatos = await sql<(ConcursoParaMatch & Novo)[]>`
    select c.id, c.titulo, c.url_oficial, c.vagas_total, c.salario_max_centavos, c.orgao, c.esfera, c.uf, c.banca,
      c.escolaridades, c.areas, c.resumo,
      coalesce((select json_agg(json_build_object('nome', r.nome, 'escolaridade', r.escolaridade, 'salario_centavos', r.salario_centavos))
                from contest_roles r where r.contest_id = c.id), '[]') as cargos
    from contests c where c.publicado and not c.exemplo and c.created_at >= ${agora}::timestamptz - interval '7 days'
      and c.status in ('previsto', 'autorizado', 'banca_definida', 'edital_aberto')`;
  const custo = await configNumero("custo_email_centavos");
  const r = { enviados: 0, vazios: 0, falhas: 0, semAcesso: 0 };
  for (const p of pessoas) {
    const [sub] = await sql<AssinaturaLike[]>`
      select plano, status, trial_ends_at, current_period_end from subscriptions where user_id = ${p.id}
      order by (status in ('trial','ativa','inadimplente')) desc, created_at desc limit 1`;
    if (!calcularAcesso(sub, agora).liberado) {
      r.semAcesso++;
      continue;
    }
    const perfis = await sql<PerfilBusca[]>`
      select escolaridades, areas, cargos, ufs, incluir_nacional, salario_min_centavos, bancas, palavras_chave, ativo
      from profiles where user_id = ${p.id} and ativo`;
    const novos = candidatos.filter((c) => perfis.some((pf) => casarPerfil(pf, c).casa)).slice(0, 10);
    const prazos = await sql<{ concurso: string; tipo: DateTipo; inicio: string | null; fim: string | null; url_oficial: string }[]>`
      select coalesce(c.orgao_sigla, c.orgao) as concurso, d.tipo, d.inicio, d.fim, c.url_oficial
      from follows f join contests c on c.id = f.contest_id join contest_dates d on d.contest_id = c.id
      where f.user_id = ${p.id} and d.tipo in ('isencao', 'inscricao', 'pagamento', 'prova', 'local_prova')
        and coalesce(d.fim, d.inicio) between ${hoje}::date and ${somarDias(hoje, 14)}::date
      order by coalesce(d.fim, d.inicio) limit 20`;
    const erratas = await sql<{ concurso: string; resumo: string | null; url_oficial: string }[]>`
      select coalesce(c.orgao_sigla, c.orgao) as concurso, v.resumo, c.url_oficial
      from contest_versions v join follows f on f.contest_id = v.contest_id and f.user_id = ${p.id}
      join contests c on c.id = v.contest_id
      where v.created_at >= ${agora}::timestamptz - interval '7 days' order by v.created_at desc limit 10`;
    const itens = novos.length + prazos.length + erratas.length;
    if (!itens) {
      await sql`insert into email_resumos (user_id, semana, status, itens) values (${p.id}, ${semana}, 'vazio', 0) on conflict do nothing`;
      r.vazios++;
      continue;
    }
    const secao = (titulo: string, linhas: string[]) =>
      linhas.length ? `<h3 style="font-size:16px;margin:20px 0 8px">${titulo}</h3><ul style="padding-left:18px;line-height:1.6">${linhas.join("")}</ul>` : "";
    const html = `<div style="font-family:Arial,sans-serif;color:#0F1530;max-width:600px">
<h2 style="font-size:20px">Sua semana de concursos</h2>
${secao("Concursos novos no seu perfil", novos.map((c) => `<li><a href="${c.url_oficial}" style="color:#1F3FD1">${esc(c.titulo)}</a>${c.vagas_total ? ` · ${c.vagas_total} vagas` : ""}${c.salario_max_centavos ? ` · até ${brl(c.salario_max_centavos)}` : ""}</li>`))}
${secao("Prazos dos próximos 14 dias", prazos.map((d) => `<li><strong>${esc(d.concurso)}</strong> · ${DATE_TIPO_LABEL[d.tipo]}: ${d.inicio && d.fim && d.inicio !== d.fim ? `${dataBR(d.inicio)} a ${dataBR(d.fim)}` : dataBR(d.fim ?? d.inicio)} · <a href="${d.url_oficial}" style="color:#1F3FD1">link oficial</a></li>`))}
${secao("Erratas da semana", erratas.map((e) => `<li><strong>${esc(e.concurso)}</strong>: ${esc(e.resumo ?? "edital alterado")} · <a href="${e.url_oficial}" style="color:#1F3FD1">link oficial</a></li>`))}
<p style="font-size:12px;color:#4F566E;margin-top:24px">Você recebe este resumo porque ativou o e-mail semanal. <a href="${appUrl()}/conta" style="color:#4F566E">Mudar preferências</a></p></div>`;
    const envio = await enviarEmail({ para: p.email, assunto: `Aviso Concurso · resumo da semana (${dataBR(hoje)})`, html });
    await sql`insert into email_resumos (user_id, semana, status, itens, custo_centavos, erro)
              values (${p.id}, ${semana}, ${envio.ok ? "enviado" : "falhou"}, ${itens}, ${envio.ok ? custo : 0}, ${envio.erro ?? null})
              on conflict (user_id, semana) do nothing`;
    if (envio.ok) r.enviados++;
    else r.falhas++;
  }
  return r;
}
