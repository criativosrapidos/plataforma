import type { Metadata } from "next";
import { createHash } from "node:crypto";
import { sql } from "@/lib/db";
import { FormRedefinir, TituloAuth } from "@/components/conta/Autenticacao";
import { BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { param } from "@/components/ui/destino";

export const metadata: Metadata = {
  title: "Criar nova senha",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Busca = Promise<Record<string, string | string[] | undefined>>;

/** Confere o link antes de mostrar o formulário (expirado ou usado → pede outro). */
export default async function PaginaRedefinir({ searchParams }: { searchParams: Busca }) {
  const token = param((await searchParams).token);
  let valido = false;
  if (token && token.length >= 20 && token.length <= 200) {
    const hash = createHash("sha256").update(token).digest("hex");
    const [r] = await sql`select 1 from password_resets where token_hash = ${hash} and used_at is null and expires_at > now()`;
    valido = !!r;
  }
  if (!token || !valido) {
    return (
      <div className="grid gap-6">
        <span className="grid size-16 place-items-center rounded-full bg-verm-t text-[#A8232A]">
          <Icone nome="relogio" tamanho={30} />
        </span>
        <TituloAuth
          rotulo="Link de nova senha"
          titulo="Link expirado"
          texto="Este link já foi usado ou passou de 1 hora. Por segurança, peça um novo: leva um minuto."
        />
        <BotaoLink href="/recuperar-senha" tamanho="lg" larguraTotal>
          Pedir novo link
        </BotaoLink>
        <BotaoLink href="/entrar" variante="secundario" larguraTotal>
          Voltar para entrar
        </BotaoLink>
      </div>
    );
  }
  return <FormRedefinir token={token} />;
}
