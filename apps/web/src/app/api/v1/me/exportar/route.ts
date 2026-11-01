import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { exigirUsuario, rota } from "@/lib/api";
import { hojeISO } from "@aviso/shared";

/**
 * LGPD (art. 18, II e V): baixar meus dados. Devolve um JSON com tudo o que está ligado à pessoa.
 * Nunca inclui o hash da senha nem tokens de sessão.
 */
export const GET = rota(async () => {
  const s = await exigirUsuario();
  const id = s.id;
  const [
    [usuario],
    ajustes,
    assinaturas,
    pagamentos,
    perfis,
    acompanhamentos,
    avisos,
    perguntas,
    dispositivos,
    sessoes,
    contatos,
    registros,
  ] = await Promise.all([
    sql`select id, nome, email::text as email, role as papel, telefone, whatsapp_optin, whatsapp_optin_em,
               busca_nominal_optin, nome_busca, termos_aceitos_em, email_verificado_em, ultimo_acesso_em, created_at, updated_at
        from users where id = ${id}`,
    sql`select push_on, whatsapp_on, email_resumo, antecedencia_dias, silencio_inicio::text, silencio_fim::text, updated_at
        from user_settings where user_id = ${id}`,
    sql`select id, plano, ciclo, status, metodo, trial_ends_at, current_period_end, cancel_at_period_end, provider,
               canceled_at, created_at, updated_at
        from subscriptions where user_id = ${id} order by created_at`,
    sql`select id, subscription_id, valor_centavos, status, metodo, vencimento, pago_em, created_at
        from payments where user_id = ${id} order by created_at`,
    sql`select id, nome, escolaridades, areas, cargos, ufs, incluir_nacional, salario_min_centavos, bancas, palavras_chave,
               ativo, created_at, updated_at
        from profiles where user_id = ${id} order by created_at`,
    sql`select f.id, f.contest_id, c.titulo as concurso, c.url_oficial, f.role_id, f.cor, f.nas_materias, f.created_at,
               coalesce((select json_agg(json_build_object('texto', i.texto, 'feito', i.feito, 'ordem', i.ordem) order by i.ordem)
                         from checklist_items i where i.follow_id = f.id), '[]') as checklist
        from follows f join contests c on c.id = f.contest_id where f.user_id = ${id} order by f.created_at`,
    sql`select id, contest_id, tipo, canal, titulo, corpo, url_oficial, status, enviado_em, lido_em, created_at
        from alerts where user_id = ${id} order by created_at`,
    sql`select id, contest_id, pergunta, resposta, citacoes, encontrado, created_at
        from questions where user_id = ${id} order by created_at`,
    sql`select id, plataforma, ativo, created_at, last_seen_at, left(expo_push_token, 18) || '…' as token_parcial
        from devices where user_id = ${id} order by created_at`,
    sql`select id, cliente, user_agent, created_at, expires_at, revoked_at
        from sessions where user_id = ${id} order by created_at`,
    sql`select nome, email::text as email, whatsapp, origem, utm, created_at from leads where email = ${s.email}`,
    sql`select acao, entidade, entidade_id, dados, created_at from audit_log where actor_id = ${id} order by created_at`,
  ]);

  const dados = {
    sobre: {
      servico: "Aviso Concurso",
      gerado_em: new Date().toISOString(),
      descricao:
        "Cópia dos seus dados pessoais guardados pelo Aviso Concurso (LGPD, art. 18). Não inclui a sua senha, que é guardada só como hash.",
      contato_privacidade: "privacidade@avisoconcurso.com.br",
    },
    usuario,
    ajustes: ajustes[0] ?? null,
    assinaturas,
    pagamentos,
    perfis_de_busca: perfis,
    concursos_acompanhados: acompanhamentos,
    avisos,
    perguntas_ao_edital: perguntas,
    dispositivos,
    sessoes,
    contato_pre_lancamento: contatos,
    registros_de_atividade: registros,
  };

  await sql`insert into audit_log (actor_id, acao, entidade, entidade_id) values (${id}, 'dados_exportados', 'user', ${id})`;
  return new NextResponse(JSON.stringify(dados, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="aviso-concurso-meus-dados-${hojeISO()}.json"`,
      "cache-control": "no-store",
    },
  });
});
