import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TRIAL_DAYS } from "@aviso/shared";
import { sessaoAtual } from "@/lib/auth/session";
import { FormCadastro } from "@/components/conta/Autenticacao";
import { destinoSeguro, param } from "@/components/ui/destino";

export const metadata: Metadata = {
  title: "Criar conta",
  description: `Crie sua conta no Aviso Concurso e teste ${TRIAL_DAYS} dias grátis: aviso de edital, prazo e prova no celular.`,
  alternates: { canonical: "/cadastro" },
};

type Busca = Promise<Record<string, string | string[] | undefined>>;

/** Depois do cadastro, a pessoa vai para /assinar com o plano escolhido na landing (se houver). */
export default async function PaginaCadastro({ searchParams }: { searchParams: Busca }) {
  const sp = await searchParams;
  const voltar = destinoSeguro(sp.voltar);
  const qs = new URLSearchParams();
  const plano = param(sp.plano);
  const ciclo = param(sp.ciclo);
  if (plano === "aviso" || plano === "aprovado") qs.set("plano", plano);
  if (ciclo === "mensal" || ciclo === "anual") qs.set("ciclo", ciclo);
  if (voltar !== "/conta") qs.set("voltar", voltar);
  const destino = qs.size ? `/assinar?${qs}` : "/assinar";
  if (await sessaoAtual()) redirect(destino);
  return <FormCadastro destino={destino} voltar={voltar} />;
}
