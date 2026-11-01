import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/auth/session";
import { FormEntrar } from "@/components/conta/Autenticacao";
import { Aviso } from "@/components/ui/Aviso";
import { destinoSeguro, param } from "@/components/ui/destino";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta do Aviso Concurso para cuidar da assinatura, dos perfis de busca e dos seus dados.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/entrar" },
};

type Busca = Promise<Record<string, string | string[] | undefined>>;

export default async function PaginaEntrar({ searchParams }: { searchParams: Busca }) {
  const sp = await searchParams;
  const voltar = destinoSeguro(sp.voltar);
  if (await sessaoAtual()) redirect(voltar);
  const motivo = param(sp.motivo);
  const aviso =
    motivo === "saiu" ? (
      <Aviso tom="sucesso">Você saiu da sua conta.</Aviso>
    ) : motivo === "excluida" ? (
      <Aviso tom="sucesso" titulo="Conta excluída">
        Seus dados pessoais foram apagados. Obrigado por ter usado o Aviso Concurso.
      </Aviso>
    ) : sp.voltar ? (
      <Aviso tom="info">Entre na sua conta para continuar.</Aviso>
    ) : undefined;
  return <FormEntrar voltar={voltar} aviso={aviso} emailInicial={param(sp.email)} />;
}
