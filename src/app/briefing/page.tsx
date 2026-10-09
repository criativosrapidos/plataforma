"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { BriefingForm } from "@/components/BriefingForm";
import { BotaoLink, Destaque } from "@/components/ui";

// Página pública do briefing: o link que a agência ou o cliente manda pra quem vai preencher.
export default function BriefingPublico() {
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <AuthShell>
        <h1 className="text-4xl">
          Briefing <Destaque>recebido.</Destaque>
        </h1>
        <p className="mt-3 text-cinza">A equipe já começa a produção. Você recebe um aviso no WhatsApp quando as primeiras peças ficarem prontas.</p>
        <BotaoLink href="/cliente" className="mt-8 w-full" tamanho="lg">
          Ir pra minha área
        </BotaoLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-4xl">
        Conta pra gente sobre a sua <Destaque>marca.</Destaque>
      </h1>
      <p className="mt-3 mb-6 text-cinza">Leva uns 5 minutos. É daqui que sai cada reel e carrossel.</p>
      <BriefingForm
        onSalvar={() => {
          setEnviado(true);
          window.scrollTo(0, 0);
        }}
      />
      <p className="mt-4 text-center text-xs text-cinza">
        Dúvida? <Link href="/" className="font-extrabold underline">Fale com a Criativos Rápidos</Link>
      </p>
    </AuthShell>
  );
}
