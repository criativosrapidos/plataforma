"use client";

import { useRouter } from "next/navigation";
import { BriefingForm } from "@/components/BriefingForm";
import { useCliente } from "@/lib/cliente-store";

export default function BriefingCliente() {
  const router = useRouter();
  const { cliente, salvarBriefing } = useCliente();
  return (
    <>
      <h1 className="text-3xl">Briefing da marca</h1>
      <p className="mt-1 mb-5 text-cinza">É daqui que a equipe tira tudo pra criar. Quanto mais detalhe, melhor o resultado.</p>
      <BriefingForm
        inicial={cliente.briefing}
        botao={cliente.briefing ? "Salvar alterações" : "Enviar briefing"}
        onSalvar={(b) => {
          salvarBriefing(b);
          router.push("/cliente/marca?salvo=1");
        }}
      />
    </>
  );
}
