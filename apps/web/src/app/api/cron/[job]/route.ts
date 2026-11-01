import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ehJob, rodarJob } from "@/lib/pipeline/jobs";

// Jobs agendados (vercel.json). A Vercel chama com `Authorization: Bearer $CRON_SECRET`.
export const maxDuration = 300;

type Ctx = { params: Promise<{ job: string }> };

function autorizado(req: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  const recebido = req.headers.get("authorization");
  if (!segredo || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(`Bearer ${segredo}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function executar(req: Request, ctx: Ctx) {
  if (!autorizado(req)) return NextResponse.json({ erro: { codigo: "nao_autorizado", mensagem: "Não autorizado." } }, { status: 401 });
  const { job } = await ctx.params;
  if (!ehJob(job)) return NextResponse.json({ erro: { codigo: "nao_encontrado", mensagem: `Job desconhecido: ${job}` } }, { status: 404 });
  const data = new URL(req.url).searchParams.get("data");
  const r = await rodarJob(job, { data: data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : undefined, agendado: true });
  return NextResponse.json(r, { status: r.ok ? 200 : 500 });
}

export const GET = executar;
export const POST = executar;
