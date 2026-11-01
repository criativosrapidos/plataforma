import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TelaRevisao } from "@/components/admin/revisao/TelaRevisao";
import { exigirPainel } from "@/lib/admin/auth";
import { lerConfigValor } from "@/lib/admin/consultas/config";
import { extracaoDetalhe, nomesMaterias, vizinhosNaFila } from "@/lib/admin/consultas/revisao";
import { ehUuid } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Revisar extração" };

export default async function RevisarExtracao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await exigirPainel("editor", `/admin/revisao/${id}`);
  if (!ehUuid(id)) notFound();
  const [ex, nav, materias, limiar] = await Promise.all([extracaoDetalhe(id), vizinhosNaFila(id), nomesMaterias(), lerConfigValor("revisao_limiar_confianca")]);
  if (!ex) notFound();
  // key: remonta o formulário ao trocar de item (J/K) sem carregar estado do anterior.
  return <TelaRevisao key={ex.id} ex={ex} nav={nav} materias={materias} limiar={Number(limiar)} />;
}
