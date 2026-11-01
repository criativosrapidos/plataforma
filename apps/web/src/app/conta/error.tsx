"use client";

import { useEffect } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Botao, BotaoLink } from "@/components/ui/Botao";

export default function ErroConta({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.4rem,6vw,3.6rem)]">Algo deu errado</h1>
      <Aviso tom="erro" titulo="Não conseguimos carregar esta página.">
        Pode ser uma instabilidade momentânea. Tente de novo em alguns segundos.
        {error.digest ? <span className="mt-1 block font-mono text-xs text-tx2">Código: {error.digest}</span> : null}
      </Aviso>
      <div className="flex flex-wrap gap-3">
        <Botao onClick={reset}>Tentar de novo</Botao>
        <BotaoLink href="/conta" variante="secundario">
          Voltar para a conta
        </BotaoLink>
      </div>
    </div>
  );
}
