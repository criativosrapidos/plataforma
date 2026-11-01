import type { Metadata } from "next";
import Link from "next/link";
import { CONTEST_STATUS_LABEL, type ContestStatus } from "@aviso/shared";
import { Cabecalho, Cartao, Etiqueta, Vazio } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { buscaGlobal } from "@/lib/admin/consultas/busca";
import { CONCURSO_STATUS_TOM, PAPEL_ROTULO, PAPEL_TOM } from "@/lib/admin/formato";
import { str, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Busca" };

export default async function Busca({ searchParams }: { searchParams: Promise<SP> }) {
  const s = await exigirPainel("editor", "/admin/busca");
  const sp = await searchParams;
  const q = (str(sp, "q") ?? "").slice(0, 100);
  const admin = s.role === "admin";
  const r = await buscaGlobal(q, admin, 50);

  return (
    <>
      <Cabecalho titulo="Busca" sub={q ? `Resultados para “${q}”.` : "Digite pelo menos 2 letras na busca do topo."} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Cartao titulo={`Concursos (${r.concursos.length})`} corpo={false}>
          {r.concursos.length === 0 ? (
            <Vazio titulo="Nenhum concurso" />
          ) : (
            <ul className="divide-y divide-linha">
              {r.concursos.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/concursos/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] hover:bg-papel">
                    <span className="min-w-0">
                      <b className="font-semibold">{c.titulo}</b>
                      <span className="block truncate text-[12px] text-tx2">
                        {c.orgao} · {c.uf ?? "Nacional"}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                      <Etiqueta tom={CONCURSO_STATUS_TOM[c.status]}>{CONTEST_STATUS_LABEL[c.status as ContestStatus]}</Etiqueta>
                      {!c.publicado && <Etiqueta tom="ambar">Rascunho</Etiqueta>}
                      {c.exemplo && <Etiqueta>Exemplo</Etiqueta>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
        {admin && (
          <Cartao titulo={`Usuários (${r.usuarios.length})`} corpo={false}>
            {r.usuarios.length === 0 ? (
              <Vazio titulo="Nenhum usuário" />
            ) : (
              <ul className="divide-y divide-linha">
                {r.usuarios.map((u) => (
                  <li key={u.id}>
                    <Link href={`/admin/usuarios/${u.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] hover:bg-papel">
                      <span className="min-w-0">
                        <b className="font-semibold">{u.nome}</b>
                        <span className="block truncate text-[12px] text-tx2">{u.email}</span>
                      </span>
                      <Etiqueta tom={PAPEL_TOM[u.role]}>{PAPEL_ROTULO[u.role]}</Etiqueta>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        )}
      </div>
    </>
  );
}
