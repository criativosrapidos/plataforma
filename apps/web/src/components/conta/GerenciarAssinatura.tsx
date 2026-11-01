"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PLANO_INFO, TRIAL_DAYS, brl, dataBR, dataHoraBR, precoCentavos,
  type AssinaturaDTO, type Ciclo, type CheckoutResponse, type Plano,
} from "@aviso/shared";
import { api, useEnvio } from "@/components/ui/api-cliente";
import { Botao } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";
import { Dialogo } from "@/components/ui/Dialogo";
import { SeletorCiclo } from "@/components/site/Planos";
import { EscolhaMetodo, EscolhaPlano, type Metodo } from "./EscolhaPlano";
import { Painel } from "./Blocos";

type Props = {
  assinatura: AssinaturaDTO | null;
  viva: boolean;
  liberado: boolean;
  podeTestar: boolean;
};

/** Trocar plano/ciclo, cancelar (com confirmação) ou começar o teste/assinatura. */
export function GerenciarAssinatura({ assinatura, viva, liberado, podeTestar }: Props) {
  const router = useRouter();
  const [plano, setPlano] = useState<Plano>(assinatura?.plano ?? "aviso");
  const [ciclo, setCiclo] = useState<Ciclo>(assinatura?.ciclo ?? "mensal");
  const [metodo, setMetodo] = useState<Metodo>(assinatura?.metodo ?? "pix_automatico");
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const troca = useEnvio();
  const cancelar = useEnvio();
  const nova = useEnvio();

  const mudou = !!assinatura && (plano !== assinatura.plano || ciclo !== assinatura.ciclo);
  const ate = assinatura ? (assinatura.status === "trial" ? assinatura.trial_ends_at : (assinatura.current_period_end ?? assinatura.trial_ends_at)) : null;

  async function trocar() {
    setSucesso(null);
    const r = await troca.enviar(() => api<AssinaturaDTO>("/api/v1/assinatura/trocar", { corpo: { plano, ciclo } }));
    if (r) {
      setSucesso(`Pronto. Agora você está no plano ${PLANO_INFO[r.plano].nome} ${r.ciclo === "anual" ? "anual" : "mensal"}. O novo valor vale a partir da próxima cobrança.`);
      router.refresh();
    }
  }

  async function confirmarCancelamento() {
    const r = await cancelar.enviar(() => api<AssinaturaDTO>("/api/v1/assinatura/cancelar", { corpo: {} }));
    if (r) {
      setConfirmarCancelar(false);
      setSucesso(`Assinatura cancelada. Você continua usando até ${dataHoraBR(r.current_period_end ?? r.trial_ends_at)} e não será cobrado de novo.`);
      router.refresh();
    }
  }

  async function assinar() {
    setSucesso(null);
    const r = await nova.enviar(() => api<CheckoutResponse>("/api/v1/assinatura/checkout", { corpo: { plano, ciclo, metodo } }));
    if (!r) return;
    if (r.checkout_url) {
      window.location.assign(r.checkout_url);
      return;
    }
    setSucesso(
      r.assinatura.status === "trial"
        ? `Teste começou. Você usa o plano ${PLANO_INFO[r.assinatura.plano].nome} até ${dataBR(r.assinatura.trial_ends_at)} sem pagar nada.`
        : `Assinatura do plano ${PLANO_INFO[r.assinatura.plano].nome} ativa.`,
    );
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      {sucesso ? <Aviso tom="sucesso">{sucesso}</Aviso> : null}

      {viva && assinatura ? (
        <>
          <Painel
            id="trocar"
            titulo="Trocar de plano"
            descricao="A troca vale na hora. Se o valor mudar, o novo preço entra na próxima cobrança."
          >
            <SeletorCiclo ciclo={ciclo} aoMudar={setCiclo} />
            <div className="mt-5">
              <EscolhaPlano plano={plano} ciclo={ciclo} aoMudar={setPlano} atual={assinatura.ciclo === ciclo ? assinatura.plano : null} />
            </div>
            {troca.erro ? <Aviso tom="erro" className="mt-4">{troca.erro}</Aviso> : null}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Botao onClick={trocar} disabled={!mudou} carregando={troca.enviando}>
                {mudou ? `Mudar para ${PLANO_INFO[plano].nome} ${ciclo === "anual" ? "anual" : "mensal"}` : "Este é o seu plano atual"}
              </Botao>
              {mudou ? (
                <span className="text-[15px] text-tx2">
                  {brl(precoCentavos(plano, ciclo))}/{ciclo === "anual" ? "ano" : "mês"}
                </span>
              ) : null}
            </div>
          </Painel>

          <Painel
            id="cancelar"
            titulo="Cancelar assinatura"
            descricao={
              <>
                Sem multa. Você continua com acesso até <strong className="text-tinta">{dataHoraBR(ate)}</strong> e não recebe nova cobrança.
                Seus perfis e concursos ficam salvos se quiser voltar.
              </>
            }
          >
            <Botao variante="secundario" className="!border-[#F3C3C5] !text-[#A8232A] hover:!border-verm" onClick={() => setConfirmarCancelar(true)}>
              Cancelar assinatura
            </Botao>
          </Painel>

          <Dialogo
            aberto={confirmarCancelar}
            aoFechar={() => setConfirmarCancelar(false)}
            titulo="Cancelar assinatura?"
            acoes={
              <>
                <Botao variante="secundario" onClick={() => setConfirmarCancelar(false)}>
                  Manter assinatura
                </Botao>
                <Botao variante="perigo" onClick={confirmarCancelamento} carregando={cancelar.enviando}>
                  {cancelar.enviando ? "Cancelando..." : "Sim, cancelar"}
                </Botao>
              </>
            }
          >
            <p>
              {assinatura.status === "trial" ? (
                <>
                  Seu teste continua até <strong>{dataHoraBR(ate)}</strong> e <strong>você não será cobrado</strong>.
                </>
              ) : (
                <>
                  Você continua usando o plano {PLANO_INFO[assinatura.plano].nome} até <strong>{dataHoraBR(ate)}</strong>. Depois disso,
                  não haverá nova cobrança e o app mostra só a tela de planos.
                </>
              )}
            </p>
            <p className="mt-3">Os avisos de prazo dos concursos que você acompanha param de chegar quando o acesso terminar.</p>
            {cancelar.erro ? <Aviso tom="erro" className="mt-4">{cancelar.erro}</Aviso> : null}
          </Dialogo>
        </>
      ) : liberado ? (
        <Painel titulo="Quer continuar depois?" descricao={`Quando o acesso atual terminar (${dataHoraBR(ate)}), você pode assinar de novo aqui. Seus perfis e concursos continuam salvos.`} />
      ) : (
        <Painel
          id="assinar"
          titulo={podeTestar ? `Comece seu teste de ${TRIAL_DAYS} dias` : "Assinar"}
          descricao={
            podeTestar
              ? `Hoje você não paga nada. A primeira cobrança é no ${TRIAL_DAYS + 1}º dia, se você não cancelar, e a gente avisa 1 dia antes.`
              : "Seu teste grátis já foi usado. A assinatura começa hoje e você cancela quando quiser."
          }
        >
          <SeletorCiclo ciclo={ciclo} aoMudar={setCiclo} />
          <div className="mt-5">
            <EscolhaPlano plano={plano} ciclo={ciclo} aoMudar={setPlano} />
          </div>
          <p className="mt-6 mb-3 font-bold">Forma de pagamento</p>
          <EscolhaMetodo metodo={metodo} aoMudar={setMetodo} />
          {nova.erro ? <Aviso tom="erro" className="mt-4">{nova.erro}</Aviso> : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Botao tamanho="lg" onClick={assinar} carregando={nova.enviando}>
              {podeTestar ? `Começar ${TRIAL_DAYS} dias grátis` : `Assinar por ${brl(precoCentavos(plano, ciclo))}`}
            </Botao>
            <span className="text-[15px] text-tx2">
              Depois, {brl(precoCentavos(plano, ciclo))}/{ciclo === "anual" ? "ano" : "mês"}. Cancele quando quiser.
            </span>
          </div>
        </Painel>
      )}
    </div>
  );
}
