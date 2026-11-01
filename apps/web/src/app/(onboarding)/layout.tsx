import "@/components/ui/movimento.css";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function LayoutOnboarding({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-linha bg-papel">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
          <Logo />
          <Link href="/conta" className="inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-bold text-tinta hover:bg-tinta/5">
            Minha conta
          </Link>
        </div>
      </header>
      <main id="conteudo" className="flex-1 px-4 py-8 sm:px-6 md:py-12">
        {children}
      </main>
    </div>
  );
}
