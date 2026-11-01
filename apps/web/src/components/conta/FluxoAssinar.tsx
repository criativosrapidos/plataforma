"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { PLANO_INFO, TRIAL_DAYS, brl, dataBR, precoCentavos, type CheckoutResponse, type Ciclo, type Plano } from "@aviso/shared";
import { api, useEnvio } from "@/components/ui/api-cliente";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";
import { Icone } from "@/components/ui/Icone";
import { SeletorCiclo } from "@/components/site/Planos";
import { LinhaTeste } from "@/components/site/LinhaTeste";
import { BotoesLojas, temLojas } from "@/components/site/Lojas";
import { EscolhaMetodo, EscolhaPlano, type Metodo } from "./EscolhaPlano";

const ETAPAS = ["Plano", "Confirmar", "Pronto"] as const;

function Etapas({ atual }: { atual: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Etapas">
      {ETAPAS.map((e, i) => (
        <li key={e} className="flex items-center gap-2 sm:gap-3" aria-current={i === atual ? "step" : undefined}>
          <span
            className={clsx(
              "grid size-9 place-items-center rounded-full border-[2.5px] font-mono text-sm font-bold",
              i < atual ? "border-azul bg-azul text-white" : i === atual ? "border-tinta bg-tinta text-white" : "border-[#C7CBD6] text-tx2",
            )}
          >
            {i < atual ? <Icone nome="check" tamanho={16} strokeWidth={3} /> : String.fromCharCode(65 + i)}
          </span>
          <span className={clsx("text-[15px] font-bold", i === atual ? "text-tinta" : "text-tx2", "hidden sm:inline")}>{e}</span>
          {i < ETAPAS.length - 1 ? <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-linha sm:w-10" /> : null}
        </li>
      ))}
    </ol>
  );
}

export function FluxoAssinar({
  nome,
  planoInicial,
  cicloInicial,
  podeTestar,
  voltar,
}: {
  nome: string;
  planoInicial: Plano;
  cicloInicial: Ciclo;
  podeTestar: boolean;
  voltar: string;
}) {
  const [etapa, setEtapa] = useState(0);
  const [plano, setPlano] = useState<Plano>(planoInicial);
  const [ciclo, setCiclo] = useState<Ciclo>(cicloInicial);
  const [metodo, setMetodo] = useState<Metodo>("pix_automatico");
  const [resultado, setResultado] = useState<CheckoutResponse | null>(null);
  const [inicio] = useState(() => new Date());
  const { enviando, erro, enviar } = useEnvio();
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const etapaAnterior = useRef(etapa);
  useEffect(() => {
    // a cada etapa nova, leva o foco (e a tela) para o título; não no carregamento
    if (etapaAnterior.current === etapa) return;
    etapaAnterior.current = etapa;
    window.scrollTo({ top: 0 });
    tituloRef.current?.focus({ preventScroll: true });
  }, [etapa]);

  const valor = brl(precoCentavos(plano, ciclo));
  const primeiro = nome.split(" ")[0];

  async function confirmar() {
    const r = await enviar(() => api<CheckoutResponse>("/api/v1/assinatura/checkout", { corpo: { plano, ciclo, metodo } }));
    if (!r) return;
    if (r.checkout_url) {
      window.location.assign(r.checkout_url);
      return;
    }
    setResultado(r);
    setEtapa(2);
  }

  return (
    <div className="mx-auto w-full max-w-[880px]">
      <Etapas atual={etapa} />

      {etapa === 0 ? (
        <section className="mt-8" aria-labelledby="t-etapa">
          <p className="rotulo text-azul">Olá, {primeiro}</p>
          <h1 id="t-etapa" ref={tituloRef} tabIndex={-1} className="mt-3 text-[clamp(2.6rem,7vw,4.2rem)] outline-none">
            Escolha seu <span className="grifo">plano</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-tx2">
            {podeTestar
              ? `Os ${TRIAL_DAYS} primeiros dias são grátis em qualquer plano. Dá para trocar ou cancelar quando quiser.`
              : "Seu teste grátis já foi usado. A assinatura começa hoje e você cancela quando quiser."}
          </p>
          <div className="mt-8">
            <SeletorCiclo ciclo={ciclo} aoMudar={setCiclo} />
          </div>
          <div className="mt-6">
            <EscolhaPlano plano={plano} ciclo={ciclo} aoMudar={setPlano} />
          </div>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BotaoLink href={voltar} variante="fantasma">
              Decidir depois
            </BotaoLink>
            <Botao tamanho="lg" iconeDepois="setaDireita" onClick={() => setEtapa(1)}>
              Continuar com o {PLANO_INFO[plano].nome}
            </Botao>
          </div>
        </section>
      ) : null}

      {etapa === 1 ? (
        <section className="mt-8" aria-labelledby="t-etapa">
          <h1 id="t-etapa" ref={tituloRef} tabIndex={-1} className="text-[clamp(2.6rem,7vw,4.2rem)] outline-none">
            Confirme e <span className="grifo">comece</span>
          </h1>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
            <div className="grid content-start gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-linha bg-branco p-5">
                <div>
                  <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-tx2 uppercase">Seu plano</p>
                  <p className="mt-1 font-display text-[34px] leading-none font-extrabold uppercase">
                    {PLANO_INFO[plano].nome} <span className="text-tx2">{ciclo === "anual" ? "anual" : "mensal"}</span>
                  </p>
                  <p className="mt-1 font-mono font-bold">
                    {valor}/{ciclo === "anual" ? "ano" : "mês"}
                  </p>
                </div>
                <Botao variante="secundario" tamanho="sm" onClick={() => setEtapa(0)} icone="lapis">
                  Trocar
                </Botao>
              </div>
              <div>
                <p className="mb-3 font-bold">Como você prefere pagar?</p>
                <EscolhaMetodo metodo={metodo} aoMudar={setMetodo} />
              </div>
              {erro ? <Aviso tom="erro">{erro}</Aviso> : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Botao variante="fantasma" icone="setaEsquerda" onClick={() => setEtapa(0)}>
                  Voltar
                </Botao>
                <Botao tamanho="lg" carregando={enviando} onClick={confirmar}>
                  {enviando ? "Confirmando..." : podeTestar ? `Começar meus ${TRIAL_DAYS} dias grátis` : `Assinar por ${valor}`}
                </Botao>
              </div>
              <p className="text-[13px] leading-relaxed text-tx2">
                Ao continuar, você autoriza a cobrança automática de {valor} {ciclo === "anual" ? "por ano" : "por mês"}
                {podeTestar ? ` a partir de ${dataBR(new Date(inicio.getTime() + TRIAL_DAYS * 86_400_000))}` : ""}, até cancelar.
              </p>
            </div>
            <div className="rounded-[24px] bg-tinta p-6 text-white">
              <p className="font-display text-[28px] leading-none font-extrabold uppercase">
                {podeTestar ? (
                  <>
                    Hoje você paga <span className="text-marca">R$ 0,00</span>
                  </>
                ) : (
                  <>
                    Hoje: <span className="text-marca">{valor}</span>
                  </>
                )}
              </p>
              {podeTestar ? (
                <LinhaTeste className="mt-6" inicio={inicio} valor={valor} escuro />
              ) : (
                <p className="mt-4 text-[15px] text-white/80">A renovação é automática e você cancela quando quiser, sem multa.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {etapa === 2 && resultado ? (
        <section className="mt-8" aria-labelledby="t-etapa">
          <div className="relative overflow-hidden rounded-[32px] bg-azul p-6 text-white sm:p-10">
            <div aria-hidden="true" className="absolute -top-16 -right-16 size-56 rounded-full border-[24px] border-white/10" />
            <span className="relative grid size-16 place-items-center rounded-full bg-marca text-tinta">
              <Icone nome="check" tamanho={32} strokeWidth={3} />
            </span>
            <h1 id="t-etapa" ref={tituloRef} tabIndex={-1} className="relative mt-6 text-[clamp(2.8rem,8vw,4.8rem)] outline-none">
              Pronto, <span className="text-marca">{primeiro}</span>.
            </h1>
            <p className="relative mt-3 max-w-xl text-lg text-[#D6DCFA]">
              {resultado.assinatura.status === "trial"
                ? `Seu teste do plano ${PLANO_INFO[resultado.assinatura.plano].nome} vai até ${dataBR(resultado.assinatura.trial_ends_at)}. A gente avisa 1 dia antes da primeira cobrança.`
                : `Sua assinatura do plano ${PLANO_INFO[resultado.assinatura.plano].nome} está ativa.`}
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-linha bg-branco p-6">
              <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-azul uppercase">Passo 1</p>
              <p className="mt-1 text-xl font-extrabold">Baixe o app e entre com o mesmo e-mail</p>
              <p className="mt-1 text-tx2">
                É no celular que chegam as notificações e fica a agenda dos seus concursos.
                {!temLojas ? " O app está chegando às lojas: avisaremos por e-mail." : ""}
              </p>
              {temLojas ? (
                <BotoesLojas className="mt-4" tamanho="md" />
              ) : (
                <BotaoLink href="/baixar" variante="secundario" className="mt-4" icone="celular">
                  Ver o app
                </BotaoLink>
              )}
            </div>
            <div className="rounded-[24px] border border-linha bg-branco p-6">
              <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-azul uppercase">Passo 2</p>
              <p className="mt-1 text-xl font-extrabold">Diga o que você procura</p>
              <p className="mt-1 text-tx2">Monte um perfil de busca: escolaridade, área, estados, salário. A gente avisa quando sair concurso que combina.</p>
              <BotaoLink href="/conta/perfis?novo=1" className="mt-4" iconeDepois="setaDireita">
                Criar meu perfil
              </BotaoLink>
            </div>
          </div>
          <p className="mt-6 text-center">
            <BotaoLink href={voltar} variante="fantasma">
              Ir para minha conta
            </BotaoLink>
          </p>
        </section>
      ) : null}
    </div>
  );
}
