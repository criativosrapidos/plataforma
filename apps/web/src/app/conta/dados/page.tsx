import type { Metadata } from "next";
import Link from "next/link";
import { exigirLogin } from "@/lib/auth/guards";
import { usuarioPorId } from "@/lib/repo/usuarios";
import { acessoDoUsuario } from "@/lib/repo/assinaturas";
import { CabecalhoConta, Painel } from "@/components/conta/Blocos";
import { Consentimentos, ExcluirConta, FormDadosPessoais } from "@/components/conta/MeusDados";
import { Icone } from "@/components/ui/Icone";

export const metadata: Metadata = { title: "Meus dados", robots: { index: false, follow: false } };

export default async function PaginaDados() {
  const s = await exigirLogin("/conta/dados");
  const [usuario, acesso] = await Promise.all([usuarioPorId(s.id), acessoDoUsuario(s.id)]);
  if (!usuario) return null;
  const aprovado = acesso.liberado && acesso.plano === "aprovado";
  return (
    <div className="grid grid-cols-1 gap-6">
      <CabecalhoConta
        rotulo="Meus dados"
        titulo="Seus dados, suas regras"
        texto={
          <>
            Corrija o que quiser, ligue ou desligue autorizações, baixe uma cópia ou apague tudo. Detalhes na{" "}
            <Link href="/privacidade" className="font-semibold text-azul">
              política de privacidade
            </Link>
            .
          </>
        }
      />
      <FormDadosPessoais usuario={usuario} />
      <Consentimentos usuario={usuario} aprovado={aprovado} />
      <Painel
        id="exportar"
        titulo="Baixar meus dados"
        descricao="Um arquivo JSON com tudo o que guardamos sobre você: conta, perfis, concursos acompanhados, avisos, assinatura e pagamentos. Sem a senha."
      >
        <a
          href="/api/v1/me/exportar"
          download
          className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-linha bg-branco px-6 font-bold text-tinta no-underline hover:border-tinta"
        >
          <Icone nome="baixar" tamanho={18} />
          Baixar meus dados (.json)
        </a>
      </Painel>
      <ExcluirConta />
    </div>
  );
}
