import { z } from "zod";
import { sql } from "@/lib/db";
import { ErroApi, exigirAcesso, lerJson, naoEncontrado, ok, rota } from "@/lib/api";
import { perguntarAoEdital } from "@/lib/ai/pergunte";
import { usoDoMes } from "@/lib/repo/usuarios";
import { PLANO_INFO, type PerguntaDTO } from "@aviso/shared";

type Ctx = { params: Promise<{ id: string }> };

export const GET = rota(async (_req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso("pergunte_edital");
  const itens = await sql<PerguntaDTO[]>`
    select q.id, q.pergunta, q.resposta, coalesce(q.encontrado, false) as encontrado, q.citacoes, q.created_at
    from questions q join contests c on c.id = q.contest_id
    where q.user_id = ${usuario.id} and (c.id::text = ${(await ctx.params).id} or c.slug = ${(await ctx.params).id})
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
  const uso = await usoDoMes(usuario.id);
  const limite = PLANO_INFO.aprovado.limites.perguntasMes;
  if (uso.perguntas >= limite) throw new ErroApi(429, "limite_mes", `Você usou as ${limite} perguntas deste mês. Renova no dia 1º.`);
  const r = await perguntarAoEdital({ editalTexto: c.edital_texto, pergunta, tituloConcurso: c.titulo });
  const [q] = await sql<PerguntaDTO[]>`
    insert into questions (user_id, contest_id, pergunta, resposta, citacoes, encontrado, modelo, tokens_in, tokens_out, cache_read_tokens, custo_centavos)
    values (${usuario.id}, ${c.id}, ${pergunta}, ${r.resposta}, ${sql.json(r.citacoes)}, ${r.encontrado}, ${r.modelo},
            ${r.tokensIn}, ${r.tokensOut}, ${r.cacheReadTokens}, ${r.custoCentavos})
    returning id, pergunta, resposta, encontrado, citacoes, created_at`;
  return ok({ ...q, restantes: limite - uso.perguntas - 1 }, 201);
});
