"use client";

import { useState, useTransition } from "react";
import { concederCortesiaAcao } from "@/lib/admin/acoes/usuarios";
import { Girando } from "../AcaoBotao";
import { Dialogo } from "../Dialogo";
import { useToast } from "../Toasts";
import { Aviso, botao, Campo, campoCls, cx } from "../ui";

export function FormCortesia({ userId, padraoAte, assinaturaPaga }: { userId: string; padraoAte: string; assinaturaPaga: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [plano, setPlano] = useState("aprovado");
  const [ate, setAte] = useState(padraoAte);
  const [pendente, iniciar] = useTransition();
  const toast = useToast();

  return (
    <>
      <button type="button" className={botao("sec")} onClick={() => setAberto(true)}>
        Conceder cortesia
      </button>
      <Dialogo
        aberto={aberto}
        aoFechar={() => !pendente && setAberto(false)}
        titulo="Conceder plano cortesia"
        rodape={
          <>
            <button type="button" className={botao("sec")} onClick={() => setAberto(false)} disabled={pendente}>
              Cancelar
            </button>
            <button
              type="button"
              className={botao("primario")}
              disabled={pendente || !ate}
              onClick={() =>
                iniciar(async () => {
                  if (toast.resultado(await concederCortesiaAcao(userId, plano, ate))) setAberto(false);
                })
              }
            >
              {pendente && <Girando />} Conceder
            </button>
          </>
        }
      >
        <p className="mb-3 text-tx2">A pessoa usa o plano sem pagar até a data escolhida. Cortesias ficam fora do MRR e são registradas na auditoria.</p>
        {assinaturaPaga && (
          <div className="mb-3">
            <Aviso>Esta pessoa tem assinatura paga. A assinatura atual será encerrada aqui, mas a cobrança no provedor precisa ser cancelada lá.</Aviso>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <p className="mb-1 text-[12px] font-semibold text-tx2">Plano</p>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-linha p-1">
              {(["aviso", "aprovado"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={plano === p}
                  onClick={() => setPlano(p)}
                  className={cx("min-h-9 rounded-md text-[13px] font-semibold", plano === p ? "bg-tinta text-white" : "text-tx2")}
                >
                  {p === "aviso" ? "Aviso" : "Aprovado"}
                </button>
              ))}
            </div>
          </div>
          <Campo rotulo="Até">
            <input type="date" className={cx(campoCls, "font-mono")} value={ate} onChange={(e) => setAte(e.target.value)} />
          </Campo>
        </div>
      </Dialogo>
    </>
  );
}
