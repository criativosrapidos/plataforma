import "@/components/ui/movimento.css";
import Link from "next/link";
import { sql } from "@/lib/db";
import { sessaoAtual } from "@/lib/auth/session";
import { Logo } from "@/components/ui/Logo";
import { Icone } from "@/components/ui/Icone";
import { BotaoSair, NavConta } from "@/components/conta/NavConta";

/**
 * Casca da área do cliente. Cada página chama exigirLogin() com o próprio caminho,
 * para o login voltar ao lugar certo; aqui só montamos o cabeçalho e a navegação.
 */
export default async function LayoutConta({ children }: { children: React.ReactNode }) {
  const s = await sessaoAtual();
  if (!s) return <>{children}</>;
  const [{ naolidos }] = await sql<{ naolidos: number }[]>`
    select count(*)::int as naolidos from alerts where user_id = ${s.id} and canal = 'inapp' and lido_em is null`;
  const equipe = s.role === "admin" || s.role === "editor";
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-tinta focus:px-4 focus:py-3 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b border-linha bg-branco/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <div className="flex items-center gap-3">
            <span className="sm:hidden">
              <Logo tamanho="sm" />
            </span>
            <span className="hidden sm:block">
              <Logo />
            </span>
            <span className="hidden rounded-full bg-papel px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-tx2 uppercase ring-1 ring-linha md:inline">
              Minha conta
            </span>
          </div>
          <div className="flex items-center gap-1">
            {equipe ? (
              <Link href="/admin" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-bold text-azul hover:bg-azul-t">
                <Icone nome="escudo" tamanho={18} />
                <span className="hidden sm:inline">Painel</span>
              </Link>
            ) : null}
            <span className="hidden max-w-[200px] truncate px-2 text-[15px] text-tx2 md:inline">{s.nome}</span>
            <BotaoSair compacto />
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1200px] flex-1 gap-6 px-4 pt-5 pb-16 sm:px-6 grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 lg:pt-10">
        <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <NavConta naoLidos={naolidos} />
          <div className="mt-6 hidden rounded-[20px] border border-linha bg-branco p-4 lg:block">
            <Icone nome="celular" tamanho={20} className="text-azul" />
            <p className="mt-2 text-[15px] font-bold">Os avisos chegam pelo app</p>
            <p className="mt-1 text-sm text-tx2">Aqui você cuida da conta. Agenda, notificações e matérias ficam no celular.</p>
            <Link href="/baixar" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-azul">
              Baixar o app <Icone nome="setaDireita" tamanho={14} />
            </Link>
          </div>
        </aside>
        <main id="conteudo" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
