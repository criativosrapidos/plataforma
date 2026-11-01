import { sessaoAtual, encerrarSessao } from "@/lib/auth/session";
import { ok, rota } from "@/lib/api";

export const POST = rota(async () => {
  const s = await sessaoAtual();
  if (s) await encerrarSessao(s.sessaoId);
  return ok({ ok: true });
});
