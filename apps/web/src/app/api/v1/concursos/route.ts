import { z } from "zod";
import { ok, rota, semAcesso } from "@/lib/api";
import { sessaoAtual } from "@/lib/auth/session";
import { buscarConcursos } from "@/lib/repo/concursos";
import { acessoDoUsuario } from "@/lib/repo/assinaturas";
import { AREAS, CONTEST_STATUS, ESCOLARIDADES, ESFERAS, UFS, temRecurso } from "@aviso/shared";

const vazioParaUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);
const Query = z.object({
  q: z.preprocess(vazioParaUndefined, z.string().trim().max(100).optional()),
  uf: z.preprocess(vazioParaUndefined, z.enum(UFS).optional()),
  escolaridade: z.preprocess(vazioParaUndefined, z.enum(ESCOLARIDADES).optional()),
  area: z.preprocess(vazioParaUndefined, z.enum(AREAS).optional()),
  banca: z.preprocess(vazioParaUndefined, z.string().trim().max(40).optional()),
  status: z.preprocess(vazioParaUndefined, z.enum(CONTEST_STATUS).optional()),
  esfera: z.preprocess(vazioParaUndefined, z.enum(ESFERAS).optional()),
  salario_min: z.preprocess(vazioParaUndefined, z.coerce.number().int().min(0).max(100_000_00).optional()),
  radar: z.preprocess(vazioParaUndefined, z.enum(["0", "1"]).optional()),
  abertos: z.preprocess(vazioParaUndefined, z.enum(["0", "1"]).optional()),
  pagina: z.preprocess(vazioParaUndefined, z.coerce.number().int().min(1).max(10_000).default(1)),
  por_pagina: z.preprocess(vazioParaUndefined, z.coerce.number().int().min(1).max(50).default(20)),
  ordem: z.preprocess(vazioParaUndefined, z.enum(["recentes", "salario", "vagas", "prazo"]).default("recentes")),
});

/**
 * Busca de concursos do app (Explorar). Previstos/autorizados (o radar) só para quem tem o plano Aprovado:
 * `radar=1` sem o plano → 403; sem `radar`, eles não aparecem para quem não tem o recurso.
 */
export const GET = rota(async (req: Request) => {
  const q = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const s = await sessaoAtual();
  const temRadar = !!s && temRecurso(await acessoDoUsuario(s.id), "radar");
  if (q.radar === "1" && !temRadar) throw semAcesso("O radar de previstos e autorizados é do plano Aprovado.");
  const r = await buscarConcursos(
    {
      q: q.q, uf: q.uf, escolaridade: q.escolaridade, area: q.area, banca: q.banca, status: q.status, esfera: q.esfera,
      salarioMin: q.salario_min,
      radar: q.radar === "1",
      incluirRadar: temRadar,
      abertos: q.abertos === "1",
      exemplos: process.env.SHOW_EXEMPLOS === "1" ? undefined : false,
      pagina: q.pagina,
      porPagina: q.por_pagina,
      ordem: q.ordem,
    },
    s?.id ?? null,
  );
  return ok(r);
});
