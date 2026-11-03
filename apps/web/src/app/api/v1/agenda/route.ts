import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirAcesso, ok, rota } from "@/lib/api";
import { agenda } from "@/lib/repo/agenda";
import { diasEntre, hojeISO, somarDias } from "@aviso/shared";

/** AAAA-MM-DD que existe no calendário (rejeita 2026-02-30). */
const dataReal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD").refine((s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === s;
}, "Data inválida");

const Query = z.object({
  de: dataReal.optional(),
  ate: dataReal.optional(),
  concurso: z.string().trim().min(1).max(120).optional(),
});

export const GET = rota(async (req: Request) => {
  const { usuario } = await exigirAcesso();
  const q = Query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const de = q.de ?? hojeISO();
  let ate = q.ate ?? somarDias(de, 60);
  if (diasEntre(de, ate) < 0) ate = de;
  if (diasEntre(de, ate) > 400) ate = somarDias(de, 400); // no máximo ~13 meses por chamada
  let contestId: string | undefined;
  if (q.concurso) {
    const [c] = await sql<{ id: string }[]>`select id from contests where id::text = ${q.concurso} or slug = ${q.concurso}`;
    if (!c) return ok([]);
    contestId = c.id;
  }
  return ok(await agenda(usuario.id, de, ate, contestId));
});
