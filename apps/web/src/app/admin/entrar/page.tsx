import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/auth/session";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false, follow: false } };

function destinoSeguro(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.startsWith("/admin") && !s.startsWith("//") ? s : "/admin";
}

export default async function EntrarPainel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const voltar = destinoSeguro(sp.voltar);
  const s = await sessaoAtual();
  if (s && s.role !== "user") redirect(voltar);
  return (
    <main className="grid min-h-dvh place-items-center bg-tinta px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3 text-white">
          <Image src="/simbolo.svg" alt="" width={40} height={40} className="size-10" priority />
          <div className="leading-none">
            <p className="font-display text-2xl font-extrabold uppercase">Aviso Concurso</p>
            <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[.16em] text-marca">Painel da equipe</p>
          </div>
        </div>
        <div className="rounded-2xl bg-branco p-6">
          <h1 className="text-3xl">Entrar</h1>
          <p className="mt-1 text-sm text-tx2">Acesso restrito a editores e administradores.</p>
          {s && s.role === "user" && (
            <p className="mt-3 rounded-lg bg-marca-t px-3 py-2 text-[13px]">
              Você está como <b>{s.email}</b>, que não tem acesso ao painel. Entre com uma conta da equipe.
            </p>
          )}
          <FormEntrar voltar={voltar} />
        </div>
      </div>
    </main>
  );
}
