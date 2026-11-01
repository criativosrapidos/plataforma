import type { Metadata } from "next";
import { FormRecuperar } from "@/components/conta/Autenticacao";
import { param } from "@/components/ui/destino";

export const metadata: Metadata = {
  title: "Esqueci a senha",
  robots: { index: false, follow: true },
};

type Busca = Promise<Record<string, string | string[] | undefined>>;

export default async function PaginaRecuperar({ searchParams }: { searchParams: Busca }) {
  const sp = await searchParams;
  return <FormRecuperar emailInicial={param(sp.email)} />;
}
