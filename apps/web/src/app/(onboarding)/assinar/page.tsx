import type { Metadata } from "next";
import { exigirLogin } from "@/lib/auth/guards";
import { acessoDoUsuario, assinaturaAtual, jaUsouTeste } from "@/lib/repo/assinaturas";
import { FluxoAssinar } from "@/components/conta/FluxoAssinar";
import { resumoAssinatura } from "@/components/conta/status";
import { destinoSeguro, param } from "@/components/ui/destino";
import { BotaoLink } from "@/components/ui/Botao";
import { Etiqueta } from "@/components/ui/Etiqueta";

export const metadata: Metadata = {
  title: "Escolha seu plano",
  robots: { index: false, follow: false },
};

type Busca = Promise<Record<string, string | string[] | undefined>>;

/** Onboarding depois do cadastro: escolher plano → confirmar → "pronto, baixe o app". */
export default async function PaginaAssinar({ searchParams }: { searchParams: Busca }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const k of ["plano", "ciclo", "voltar"]) {
    const v = param(sp[k]);
    if (v) qs.set(k, v);
  }
  const usuario = await exigirLogin(qs.size ? `/assinar?${qs}` : "/assinar");
  const [assinatura, acesso, usouTeste] = await Promise.all([
    assinaturaAtual(usuario.id),
    acessoDoUsuario(usuario.id),
    jaUsouTeste(usuario.id),
  ]);
  const voltar = destinoSeguro(sp.voltar);
  const resumo = resumoAssinatura(assinatura, acesso, usouTeste);

  // Já tem assinatura viva: não deixa criar outra por aqui.
  if (resumo.viva) {
    return (
      <div className="mx-auto max-w-[640px] py-6">
        <Etiqueta tom={resumo.tom}>{resumo.etiqueta}</Etiqueta>
        <h1 className="mt-4 text-[clamp(2.6rem,7vw,4rem)]">
          Você já tem um <span className="grifo">plano</span>
        </h1>
        <p className="mt-4 text-lg text-tx2">
          <strong className="text-tinta">{resumo.titulo}.</strong> {resumo.texto}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <BotaoLink href="/conta/assinatura">Gerenciar assinatura</BotaoLink>
          <BotaoLink href={voltar} variante="secundario">
            Ir para minha conta
          </BotaoLink>
        </div>
      </div>
    );
  }

  const plano = param(sp.plano) === "aprovado" ? "aprovado" : "aviso";
  const ciclo = param(sp.ciclo) === "anual" ? "anual" : "mensal";
  return <FluxoAssinar nome={usuario.nome} planoInicial={plano} cicloInicial={ciclo} podeTestar={!usouTeste} voltar={voltar} />;
}
