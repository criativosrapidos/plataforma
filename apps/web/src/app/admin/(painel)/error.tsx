"use client";

import Link from "next/link";
import { useEffect } from "react";
import { botao } from "@/components/admin/ui";

export default function ErroPainel({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-verm/30 bg-branco p-6 text-center">
      <p className="rotulo text-verm">Erro</p>
      <h1 className="mt-2 text-3xl">Esta tela não carregou</h1>
      <p className="mt-2 text-sm text-tx2">
        Algo deu errado ao buscar os dados. Tente de novo; se continuar, confira se o banco está no ar e veja o log do servidor
        {digest && (
          <>
            {" "}
            (código <span className="font-mono">{digest}</span>)
          </>
        )}
        .
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button type="button" onClick={() => retry()} className={botao("primario")}>
          Tentar de novo
        </button>
        <Link href="/admin" className={botao("sec")}>
          Ir para a visão geral
        </Link>
      </div>
    </div>
  );
}
