"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PLANO_INFO, type UsuarioDTO } from "@aviso/shared";
import { api, useEnvio } from "@/components/ui/api-cliente";
import { Campo, Interruptor, Marcar } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";
import { Dialogo } from "@/components/ui/Dialogo";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import { Painel } from "./Blocos";

/** (11) 99999-0000 a partir de +5511999990000 ou dígitos. */
function formatarTelefone(v: string) {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function FormDadosPessoais({ usuario }: { usuario: UsuarioDTO }) {
  const router = useRouter();
  const [nome, setNome] = useState(usuario.nome);
  const [telefone, setTelefone] = useState(usuario.telefone ? formatarTelefone(usuario.telefone) : "");
  const [salvo, setSalvo] = useState(false);
  const { enviando, erro, campos, enviar, validar } = useEnvio();

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvo(false);
    const digitos = telefone.replace(/\D/g, "");
    if (
      validar({
        nome: nome.trim().length < 2 && "Informe seu nome",
        telefone: digitos && (digitos.length < 10 || digitos.length > 11) && "Telefone com DDD, como (11) 99999-0000",
      })
    )
      return;
    const r = await enviar(() => api("/api/v1/me", { metodo: "PATCH", corpo: { nome: nome.trim(), telefone: digitos || null } }));
    if (r) {
      setSalvo(true);
      router.refresh();
    }
  }

  return (
    <Painel id="pessoais" titulo="Dados pessoais" descricao="Usados para falar com você. O e-mail é o seu login.">
      <form onSubmit={salvar} noValidate className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Campo rotulo="Nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} erro={campos.nome} maxLength={120} />
          <Campo
            rotulo="E-mail"
            value={usuario.email}
            readOnly
            disabled
            dica={
              <>
                Para trocar o e-mail, <a href="mailto:contato@avisoconcurso.com.br" className="font-semibold text-azul">fale com a gente</a>.
              </>
            }
          />
          <Campo
            rotulo="Celular com WhatsApp"
            opcional
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 99999-0000"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            erro={campos.telefone}
            dica="Só usamos para os avisos por WhatsApp, se você autorizar abaixo."
          />
        </div>
        {erro && !Object.keys(campos).length ? <Aviso tom="erro">{erro}</Aviso> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Botao type="submit" carregando={enviando}>
            {enviando ? "Salvando..." : "Salvar dados"}
          </Botao>
          {salvo ? (
            <span role="status" className="inline-flex items-center gap-1.5 font-semibold text-[#0A6633]">
              <Icone nome="check" tamanho={18} strokeWidth={3} /> Salvo
            </span>
          ) : null}
        </div>
      </form>
    </Painel>
  );
}

export function Consentimentos({ usuario, aprovado }: { usuario: UsuarioDTO; aprovado: boolean }) {
  const router = useRouter();
  const whats = useEnvio();
  const busca = useEnvio();
  const [nomeBusca, setNomeBusca] = useState(usuario.nome_busca ?? usuario.nome);
  const [autorizo, setAutorizo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function mudarWhatsapp(v: boolean) {
    setMsg(null);
    if (v && !usuario.telefone) {
      whats.setErro("Cadastre o seu celular em Dados pessoais antes de ligar o WhatsApp.");
      return;
    }
    const r = await whats.enviar(() => api("/api/v1/me", { metodo: "PATCH", corpo: { whatsapp_optin: v } }));
    if (r) {
      setMsg(v ? "WhatsApp autorizado. Confira também se o WhatsApp está ligado em Ajustes, no app." : "WhatsApp desligado. Você não recebe mais mensagens por lá.");
      router.refresh();
    }
  }

  async function autorizarBusca(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (
      busca.validar({
        nome_busca: nomeBusca.trim().split(/\s+/).length < 2 && "Informe o nome completo, com sobrenome",
        autorizo: !autorizo && "Marque a autorização para continuar",
      })
    )
      return;
    const r = await busca.enviar(() =>
      api("/api/v1/me", { metodo: "PATCH", corpo: { busca_nominal_optin: true, nome_busca: nomeBusca.trim() } }),
    );
    if (r) {
      setMsg("Busca autorizada. Se o seu nome sair numa convocação do Diário Oficial, você recebe aviso.");
      setAutorizo(false);
      router.refresh();
    }
  }

  async function retirarBusca() {
    setMsg(null);
    const r = await busca.enviar(() => api("/api/v1/me", { metodo: "PATCH", corpo: { busca_nominal_optin: false, nome_busca: null } }));
    if (r) {
      setMsg("Autorização retirada. Paramos de procurar e apagamos o nome guardado para a busca.");
      router.refresh();
    }
  }

  const avisoPlano = (
    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-tx2">
      <Etiqueta tom="tinta">Plano {PLANO_INFO.aprovado.nome}</Etiqueta>
      Recurso do plano {PLANO_INFO.aprovado.nome}.{" "}
      <Link href="/conta/assinatura#trocar" className="font-bold text-azul">
        Ver planos
      </Link>
    </p>
  );

  return (
    <Painel
      id="consentimentos"
      titulo="Autorizações (LGPD)"
      descricao="Você decide. Cada autorização pode ser retirada a qualquer momento, e a gente para na hora."
    >
      <div aria-live="polite">{msg ? <Aviso tom="sucesso" className="mb-5">{msg}</Aviso> : null}</div>
      <div className="grid gap-6">
        <div className="rounded-2xl bg-papel p-4 sm:p-5">
          <Interruptor
            ligado={usuario.whatsapp_optin}
            aoMudar={mudarWhatsapp}
            desabilitado={whats.enviando || (!aprovado && !usuario.whatsapp_optin)}
            rotulo="Avisos de prazo pelo WhatsApp"
            descricao={
              <>
                Só para “isenção acaba amanhã” e “inscrição acaba amanhã”, no máximo {PLANO_INFO.aprovado.limites.whatsappMes} mensagens por
                mês, pela conta oficial do WhatsApp Business. O resto continua chegando como notificação do app.
              </>
            }
          />
          {!aprovado ? avisoPlano : null}
          {whats.erro ? <Aviso tom="erro" className="mt-3">{whats.erro}</Aviso> : null}
        </div>

        <div className="rounded-2xl bg-papel p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <p className="font-bold">Busca do seu nome em convocações</p>
              <p className="mt-1 text-sm leading-relaxed text-tx2">
                Procuramos o seu nome completo em atos de convocação e nomeação publicados no Diário Oficial e avisamos você. O nome é
                usado só para isso.
              </p>
            </div>
            <Etiqueta tom={usuario.busca_nominal_optin ? "verde" : "cinza"}>{usuario.busca_nominal_optin ? "Autorizada" : "Desligada"}</Etiqueta>
          </div>
          {usuario.busca_nominal_optin ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-linha bg-branco p-4">
              <p className="text-[15px]">
                Nome procurado: <strong>{usuario.nome_busca}</strong>
              </p>
              <Botao variante="secundario" tamanho="sm" onClick={retirarBusca} carregando={busca.enviando}>
                Retirar autorização
              </Botao>
            </div>
          ) : aprovado ? (
            <form onSubmit={autorizarBusca} noValidate className="mt-4 grid gap-4">
              <Campo
                rotulo="Nome completo, como nos seus documentos"
                value={nomeBusca}
                onChange={(e) => setNomeBusca(e.target.value)}
                maxLength={160}
                erro={busca.campos.nome_busca}
                autoComplete="name"
              />
              <Marcar checked={autorizo} onChange={(e) => setAutorizo(e.target.checked)} erro={busca.campos.autorizo}>
                Autorizo o Aviso Concurso a procurar este nome em atos de convocação e nomeação do Diário Oficial para me avisar. Sei que
                posso retirar esta autorização quando quiser. Veja a{" "}
                <Link href="/privacidade#busca-nominal" className="font-bold text-azul" target="_blank">
                  política de privacidade
                </Link>
                .
              </Marcar>
              <div>
                <Botao type="submit" carregando={busca.enviando}>
                  Autorizar busca
                </Botao>
              </div>
            </form>
          ) : (
            avisoPlano
          )}
          {busca.erro && !Object.keys(busca.campos).length ? <Aviso tom="erro" className="mt-3">{busca.erro}</Aviso> : null}
        </div>
      </div>
    </Painel>
  );
}

export function ExcluirConta() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const { enviando, erro, enviar } = useEnvio();
  const pode = texto.trim() === "EXCLUIR";

  async function excluir() {
    if (!pode) return;
    const r = await enviar(() => api("/api/v1/me", { metodo: "DELETE" }));
    if (r) {
      router.replace("/entrar?motivo=excluida");
      router.refresh();
    }
  }

  return (
    <Painel
      id="excluir"
      perigo
      titulo="Excluir conta"
      descricao="Cancela a assinatura sem novas cobranças, encerra todas as sessões, apaga perfis e aparelhos e anonimiza seu nome, e-mail e telefone. Não dá para desfazer."
    >
      <Botao variante="secundario" className="!border-[#F3C3C5] !text-[#A8232A] hover:!border-verm" icone="lixeira" onClick={() => setAberto(true)}>
        Excluir minha conta
      </Botao>
      <Dialogo
        aberto={aberto}
        aoFechar={() => {
          setAberto(false);
          setTexto("");
        }}
        titulo="Excluir conta?"
        acoes={
          <>
            <Botao variante="secundario" onClick={() => setAberto(false)}>
              Manter conta
            </Botao>
            <Botao variante="perigo" disabled={!pode} carregando={enviando} onClick={excluir}>
              Excluir para sempre
            </Botao>
          </>
        }
      >
        <p>Isso apaga seus perfis, encerra a assinatura e anonimiza seus dados pessoais. Se quiser uma cópia antes, baixe seus dados.</p>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            excluir();
          }}
        >
          <Campo
            rotulo={
              <>
                Digite <span className="font-mono">EXCLUIR</span> para confirmar
              </>
            }
            value={texto}
            onChange={(e) => setTexto(e.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </form>
        {erro ? <Aviso tom="erro" className="mt-4">{erro}</Aviso> : null}
      </Dialogo>
    </Painel>
  );
}
