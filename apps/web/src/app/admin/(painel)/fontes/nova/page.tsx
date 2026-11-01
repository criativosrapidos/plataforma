import type { Metadata } from "next";
import { FormFonte } from "@/components/admin/fontes/FormFonte";
import { Cabecalho, Cartao } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Nova fonte" };

export default async function NovaFonte() {
  await exigirPainel("editor", "/admin/fontes/nova");
  return (
    <>
      <Cabecalho titulo="Nova fonte" sub="O coletor correspondente ao tipo usa a configuração abaixo." voltar={{ href: "/admin/fontes", rotulo: "Fontes" }} />
      <Cartao className="max-w-3xl">
        <FormFonte id={null} inicial={{ nome: "", slug: "", tipo: "banca", url: "", frequencia_min: 60, ativo: true, config: "{}" }} />
      </Cartao>
    </>
  );
}
