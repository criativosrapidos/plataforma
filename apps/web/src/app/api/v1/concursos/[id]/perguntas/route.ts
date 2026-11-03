import { z } from "zod";
import { sql } from "@/lib/db";
import { ErroApi, exigirAcesso, lerJson, naoEncontrado, ok, rota } from "@/lib/api";
import { perguntarAoEdital } from "@/lib/ai/pergunte";
import { PLANO_INFO, type PerguntaDTO } from "@aviso/shared";

type Ctx = { params: Promise<{ id: string }> };

export const GET = rota(async (_req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso("pergunte_edital");
  const itens = await sql<PerguntaDTO[]>`
    select q.id, q.pergunta, q.resposta, coalesce(q.encontrado, false) as encontrado, q.citacoes, q.created_at
    from questions q join contests c on c.id = q.contest_id
    where q.user_id = ${usuario.id} and q.resposta is not null and (c.id::text = ${(await ctx.params).id} or c.slug = ${(await ctx.params).id})
    order by q.created_at`;
  return ok(itens);
});

export const POST = rota(async (req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso("pergunte_edital");
  const { pergunta } = await lerJson(req, z.object({ pergunta: z.string().trim().min(3).max(500) }));
  const id = (await ctx.params).id;
  const [c] = await sql<{ id: string; titulo: string; edital_texto: string | null }[]>`
    select id, titulo, edital_texto from contests where (id::text = ${id} or slug = ${id}) and publicado`;
  if (!c) throw naoEncontrado("Concurso não encontrado.");
  if (!c.edital_texto) throw new ErroApi(409, "sem_edital", "O texto deste edital ainda não está disponível para perguntas.");
  const limite = PLANO_INFO.aprovado.limites.perguntasMes;
  // Reserva a vaga do mês de forma atômica (trava por pessoa): pedidos simultâneos não passam do limite.
  const reserva = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext(${"perguntas:" + usuario.id}))`;
    const [{ n }] = await tx<{ n: number }[]>`
      select count(*)::int as n from questions where user_id = ${usuario.id}
        and created_at >= date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'`;
    if (n >= limite) return null;
    const [q] = await tx<{ id: string }[]>`
      insert into questions (user_id, contest_id, pergunta) values (${usuario.id}, ${c.id}, ${pergunta}) returning id`;
    return { id: q.id, usadas: n + 1 };
  });
  if (!reserva) throw new ErroApi(429, "limite_mes", `Você usou as ${limite} perguntas deste mês. Renova no dia 1º.`);
  let r: Awaited<ReturnType<typeof perguntarAoEdital>>;
  try {
    r = await perguntarAoEdital({ editalTexto: c.edital_texto, pergunta, tituloConcurso: c.titulo });
  } catch (e) {
    await sql`delete from questions where id = ${reserva.id}`; // não conta pergunta que não foi respondida
    throw e;
  }
  const [q] = await sql<PerguntaDTO[]>`
    update questions set resposta = ${r.resposta}, citacoes = ${sql.json(r.citacoes)}, encontrado = ${r.encontrado}, modelo = ${r.modelo},
      tokens_in = ${r.tokensIn}, tokens_out = ${r.tokensOut}, cache_read_tokens = ${r.cacheReadTokens}, custo_centavos = ${r.custoCentavos}
    where id = ${reserva.id}
    returning id, pergunta, resposta, encontrado, citacoes, created_at`;
  return ok({ ...q, restantes: Math.max(0, limite - reserva.usadas) }, 201);
});
