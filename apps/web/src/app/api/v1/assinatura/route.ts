import { exigirUsuario, ok, rota } from "@/lib/api";
import { assinaturaAtual, jaUsouTeste } from "@/lib/repo/assinaturas";
import { calcularAcesso } from "@aviso/shared";

export const GET = rota(async () => {
  const s = await exigirUsuario();
  const assinatura = await assinaturaAtual(s.id);
  return ok({ assinatura, acesso: calcularAcesso(assinatura), podeTestar: !(await jaUsouTeste(s.id)) });
});
