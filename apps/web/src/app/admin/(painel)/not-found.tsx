import Link from "next/link";
import { botao } from "@/components/admin/ui";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-linha bg-branco p-6 text-center">
      <p className="rotulo text-tx2">404</p>
      <h1 className="mt-2 text-3xl">Não encontrado</h1>
      <p className="mt-2 text-sm text-tx2">Este registro não existe ou foi removido.</p>
      <Link href="/admin" className={botao("primario", "md", "mt-5")}>
        Voltar para a visão geral
      </Link>
    </div>
  );
}
