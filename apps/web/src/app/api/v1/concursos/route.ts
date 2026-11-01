import { ok, rota } from "@/lib/api";
import { sessaoAtual } from "@/lib/auth/session";
import { buscarConcursos } from "@/lib/repo/concursos";
import { acessoDoUsuario } from "@/lib/repo/assinaturas";
import { temRecurso } from "@aviso/shared";

/** Busca pública (o site usa para SEO). O radar (previstos/autorizados) exige o plano Aprovado. */
export const GET = rota(async (req: Request) => {
  const u = new URL(req.url).searchParams;
  const s = await sessaoAtual();
  let radar = u.get("radar") === "1";
  if (radar && !(s && temRecurso(await acessoDoUsuario(s.id), "radar"))) radar = false;
  const r = await buscarConcursos(
    {
      q: u.get("q") ?? undefined,
      uf: u.get("uf") ?? undefined,
      escolaridade: u.get("escolaridade") ?? undefined,
      area: u.get("area") ?? undefined,
      banca: u.get("banca") ?? undefined,
      status: u.get("status") ?? undefined,
      esfera: u.get("esfera") ?? undefined,
      salarioMin: u.get("salario_min") ? Number(u.get("salario_min")) : undefined,
      radar,
      abertos: u.get("abertos") === "1",
      pagina: Number(u.get("pagina") ?? 1),
      porPagina: Number(u.get("por_pagina") ?? 20),
      ordem: (u.get("ordem") as "recentes") ?? "recentes",
    },
    s?.id ?? null,
  );
  return ok(r);
});
