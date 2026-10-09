"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell, Campo } from "@/components/AuthShell";
import { Botao, Destaque } from "@/components/ui";

// Entrada da área do cliente: código de acesso enviado no WhatsApp, sem senha pra lembrar.
export default function Acesso() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<"whats" | "codigo">("whats");

  return (
    <AuthShell>
      <h1 className="text-4xl">
        Área do <Destaque>cliente.</Destaque>
      </h1>
      <p className="mt-3 text-cinza">Acompanhe, aprove e baixe os seus criativos.</p>
      {etapa === "whats" ? (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setEtapa("codigo");
          }}
        >
          <Campo id="acesso-whats" label="Seu WhatsApp" type="tel" defaultValue="(71) 99999-0000" required />
          <Botao type="submit" className="w-full" tamanho="lg">
            Receber código
          </Botao>
        </form>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/cliente");
          }}
        >
          <p className="rounded-xl bg-white p-3 text-sm ring-1 ring-linha">Mandamos um código de 6 dígitos no seu WhatsApp. Na demonstração, qualquer código entra.</p>
          <Campo id="acesso-codigo" label="Código" inputMode="numeric" defaultValue="482913" required />
          <Botao type="submit" className="w-full" tamanho="lg">
            Entrar
          </Botao>
          <button type="button" onClick={() => setEtapa("whats")} className="w-full text-sm font-extrabold underline">
            Trocar número
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-cinza">
        Ainda não é cliente?{" "}
        <Link href="/#pacotes" className="font-extrabold text-preto underline">
          Ver pacotes
        </Link>
      </p>
    </AuthShell>
  );
}
