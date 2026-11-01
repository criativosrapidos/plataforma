import type { Metadata } from "next";
import { Shell } from "@/components/admin/Shell";
import { sairDoPainel } from "@/lib/admin/acoes/sessao";
import { exigirPainel } from "@/lib/admin/auth";
import { tamanhoFila } from "@/lib/admin/consultas/busca";
import { navPara } from "@/lib/admin/nav";
import "../admin.css";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel Aviso Concurso" },
  robots: { index: false, follow: false },
};

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const s = await exigirPainel("editor");
  const fila = await tamanhoFila();
  return (
    <Shell itens={navPara(s.role)} fila={fila} usuario={{ nome: s.nome, email: s.email, role: s.role }} sair={sairDoPainel}>
      {children}
    </Shell>
  );
}
