import Link from "next/link";
import { Gabarito, Logo } from "@/components/ui/Logo";
import { EMAIL_CONTATO, INSTAGRAM } from "./conteudo";

const COLUNAS = [
  {
    titulo: "Produto",
    links: [
      { href: "/como-funciona", rotulo: "Como funciona" },
      { href: "/planos", rotulo: "Planos" },
      { href: "/concursos", rotulo: "Buscar concursos" },
      { href: "/baixar", rotulo: "Baixar o app" },
    ],
  },
  {
    titulo: "Ajuda",
    links: [
      { href: "/duvidas", rotulo: "Dúvidas frequentes" },
      { href: "/fontes", rotulo: "De onde vêm os dados" },
      { href: "/entrar", rotulo: "Entrar na conta" },
      { href: "/recuperar-senha", rotulo: "Esqueci a senha" },
    ],
  },
  {
    titulo: "Legal",
    links: [
      { href: "/termos", rotulo: "Termos de uso" },
      { href: "/privacidade", rotulo: "Privacidade e LGPD" },
    ],
  },
];

export function Rodape() {
  return (
    <footer className="border-t border-linha bg-branco">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-[15px] leading-relaxed text-tx2">
              Você estuda. O Aviso Concurso vigia o Diário Oficial e os sites das bancas e organiza as datas de todos os seus
              concursos.
            </p>
            <Gabarito marcada="C" className="mt-6 scale-90 origin-left" />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUNAS.map((c) => (
              <div key={c.titulo}>
                <p className="rotulo text-tx2">{c.titulo}</p>
                <ul className="mt-3 grid gap-1">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-flex min-h-11 items-center font-semibold text-tinta no-underline hover:text-azul">
                        {l.rotulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-3">
              <p className="rotulo text-tx2">Fale com a gente</p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                <li>
                  <a href={`mailto:${EMAIL_CONTATO}`} className="inline-flex min-h-11 items-center font-semibold text-tinta hover:text-azul">
                    {EMAIL_CONTATO}
                  </a>
                </li>
                <li>
                  <a
                    href={INSTAGRAM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center font-semibold text-tinta hover:text-azul"
                  >
                    @avisoconcurso no Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-linha pt-6 text-sm text-tx2 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Aviso Concurso · avisoconcurso.com.br</p>
          <p className="max-w-xl md:text-right">
            Não somos órgão público nem banca organizadora. Todo aviso traz o link da fonte oficial. Não fazemos inscrição e não
            prometemos aprovação.
          </p>
        </div>
      </div>
    </footer>
  );
}
