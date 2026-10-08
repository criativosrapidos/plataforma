"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell, Campo } from "@/components/AuthShell";
import { Botao, Destaque } from "@/components/ui";
import { MARCAS } from "@/lib/mock";

const TONS = ["Descontraído", "Acolhedor", "Elegante", "Direto", "Divertido"];

export default function Perfil() {
  const router = useRouter();
  const m = MARCAS[0];
  const [cores, setCores] = useState(m.cores);
  const [tom, setTom] = useState(m.tom);

  return (
    <AuthShell>
      <p className="text-sm font-extrabold text-cinza">Passo 2 de 2</p>
      <h1 className="mt-2 text-4xl">
        Confere se ficou <Destaque>certo.</Destaque>
      </h1>
      <p className="mt-3 text-cinza">Foi isso que a gente entendeu da sua marca. Corrija o que quiser.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/app?novo=1");
        }}
      >
        <div className="flex items-center gap-3 rounded-xl border border-linha bg-white p-4">
          <span className="grid h-12 w-12 place-items-center rounded-full font-extrabold" style={{ background: cores[0], color: cores[3] }}>
            {m.iniciais}
          </span>
          <div className="flex-1">
            <p className="font-extrabold">Logo encontrada</p>
            <p className="text-sm text-cinza">Do perfil {m.instagram}</p>
          </div>
          <span className="text-sm font-extrabold underline">Trocar</span>
        </div>

        <Campo label="Nome da marca" defaultValue={m.nome} />
        <Campo label="Segmento" defaultValue={m.segmento} />
        <Campo label="Produtos principais" defaultValue={m.produtos.join(", ")} />
        <Campo label="Público" defaultValue={m.publico} />

        <div>
          <span className="text-sm font-extrabold">Cores</span>
          <div className="mt-1.5 flex gap-3">
            {cores.map((c, i) => (
              <label key={i} className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full border border-linha" style={{ background: c }}>
                <input
                  type="color"
                  value={c}
                  onChange={(e) => setCores((cs) => cs.map((x, j) => (j === i ? e.target.value : x)))}
                  className="absolute inset-0 opacity-0"
                  aria-label={`Cor ${i + 1}`}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-extrabold">Tom de voz</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {TONS.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTom(t)}
                className={`rounded-full border px-4 py-2 text-sm font-extrabold ${tom === t ? "border-preto bg-preto text-white" : "border-linha bg-white"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Botao type="submit" className="w-full" tamanho="lg">
          Gerar meu mês
        </Botao>
      </form>
    </AuthShell>
  );
}
