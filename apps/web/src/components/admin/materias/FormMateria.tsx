"use client";

import { useState, useTransition } from "react";
import { salvarMateriaAcao } from "@/lib/admin/acoes/coleta";
import { Girando } from "../AcaoBotao";
import { Dialogo } from "../Dialogo";
import { useToast } from "../Toasts";
import { botao, Campo, campoCls } from "../ui";

/** Criar (id null, inline) ou editar (botão que abre diálogo) uma matéria canônica. */
export function FormMateria({ id, nome = "", sinonimos = [] }: { id: string | null; nome?: string; sinonimos?: string[] }) {
  const [aberto, setAberto] = useState(false);
  const [n, setN] = useState(nome);
  const [sin, setSin] = useState(sinonimos.join("\n"));
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();
  const toast = useToast();

  function salvar() {
    iniciar(async () => {
      const r = await salvarMateriaAcao(id, n, sin);
      setErro(r.ok ? undefined : r.campos?.nome ?? r.erro);
      if (toast.resultado(r)) {
        setAberto(false);
        if (!id) {
          setN("");
          setSin("");
        }
      }
    });
  }

  const campos = (
    <>
      <Campo rotulo="Nome canônico" erro={erro} className="min-w-[220px] flex-1">
        <input className={campoCls} value={n} onChange={(e) => setN(e.target.value)} placeholder="Ex.: Direito Eleitoral" />
      </Campo>
      <Campo rotulo="Sinônimos (um por linha ou separados por vírgula)" className="min-w-[260px] flex-[2]" ajuda="Como aparece nos editais: “noções de …”, abreviações, variações.">
        <textarea rows={id ? 6 : 1} className={campoCls} value={sin} onChange={(e) => setSin(e.target.value)} placeholder="noções de direito eleitoral, legislação eleitoral" />
      </Campo>
    </>
  );

  if (!id) {
    return (
      <form
        className="flex flex-wrap items-start gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
      >
        {campos}
        <button type="submit" className={botao("primario", "md", "mt-[22px]")} disabled={pendente || n.trim().length < 2}>
          {pendente && <Girando />} Adicionar
        </button>
      </form>
    );
  }

  return (
    <>
      <button type="button" className={botao("fantasma", "sm")} onClick={() => setAberto(true)}>
        Editar
      </button>
      <Dialogo
        aberto={aberto}
        aoFechar={() => !pendente && setAberto(false)}
        titulo={`Editar “${nome}”`}
        rodape={
          <>
            <button type="button" className={botao("sec")} onClick={() => setAberto(false)} disabled={pendente}>
              Cancelar
            </button>
            <button type="button" className={botao("primario")} onClick={salvar} disabled={pendente}>
              {pendente && <Girando />} Salvar
            </button>
          </>
        }
      >
        <div className="space-y-3">{campos}</div>
      </Dialogo>
    </>
  );
}
