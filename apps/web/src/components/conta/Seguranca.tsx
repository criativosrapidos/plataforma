"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { dataHoraBR } from "@aviso/shared";
import { api, useEnvio } from "@/components/ui/api-cliente";
import { CampoSenha } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import { Painel } from "./Blocos";
import { BotaoSair } from "./NavConta";

export type Sessao = {
  id: string;
  cliente: "web" | "app";
  user_agent: string | null;
  created_at: string | Date;
  expires_at: string | Date;
  atual: boolean;
};

/** "Chrome no Android" a partir do user agent. */
function descreverAparelho(s: Sessao) {
  const ua = s.user_agent ?? "";
  const so = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : null;
  if (s.cliente === "app") return `App Aviso Concurso${so ? ` no ${so}` : ""}`;
  const nav = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  return `${nav}${so ? ` no ${so}` : ""}`;
}

export function TrocarSenha() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const router = useRouter();
  const { enviando, erro, campos, enviar, validar } = useEnvio();

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setOk(null);
    if (
      validar({
        senha_atual: !atual && "Informe a senha atual",
        nova_senha: nova.length < 8 && "Mínimo de 8 caracteres",
        confirma: nova !== confirma && "As senhas não são iguais",
      })
    )
      return;
    const r = await enviar(() => api<{ sessoesEncerradas: number }>("/api/v1/me/senha", { corpo: { senha_atual: atual, nova_senha: nova } }));
    if (r) {
      setAtual("");
      setNova("");
      setConfirma("");
      setOk(
        r.sessoesEncerradas
          ? `Senha alterada. ${r.sessoesEncerradas === 1 ? "1 outra sessão foi encerrada" : `${r.sessoesEncerradas} outras sessões foram encerradas`}.`
          : "Senha alterada.",
      );
      router.refresh();
    }
  }

  return (
    <Painel id="senha" titulo="Trocar senha" descricao="Ao trocar, as outras sessões abertas (outros navegadores e o app) são encerradas.">
      <form onSubmit={salvar} noValidate className="grid gap-5">
        <CampoSenha rotulo="Senha atual" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} erro={campos.senha_atual} classeMoldura="md:max-w-sm" />
        <div className="grid gap-5 md:grid-cols-2">
          <CampoSenha
            rotulo="Nova senha"
            autoComplete="new-password"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            erro={campos.nova_senha}
            dica="Mínimo de 8 caracteres."
          />
          <CampoSenha rotulo="Repita a nova senha" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} erro={campos.confirma} />
        </div>
        {erro && !Object.keys(campos).length ? <Aviso tom="erro">{erro}</Aviso> : null}
        {ok ? <Aviso tom="sucesso">{ok}</Aviso> : null}
        <div>
          <Botao type="submit" carregando={enviando}>
            {enviando ? "Salvando..." : "Trocar senha"}
          </Botao>
        </div>
      </form>
    </Painel>
  );
}

export function Sessoes({ sessoes }: { sessoes: Sessao[] }) {
  const router = useRouter();
  const [encerrando, setEncerrando] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const { erro, enviar } = useEnvio();
  const outras = sessoes.filter((s) => !s.atual).length;

  async function encerrar(s: Sessao) {
    setEncerrando(s.id);
    setMsg(null);
    const r = await enviar(() => api<{ atual: boolean }>(`/api/v1/sessoes/${s.id}`, { metodo: "DELETE" }));
    setEncerrando(null);
    if (!r) return;
    if (r.atual) {
      router.replace("/entrar?motivo=saiu");
      router.refresh();
      return;
    }
    setMsg(`Sessão encerrada: ${descreverAparelho(s)}.`);
    router.refresh();
  }

  async function encerrarOutras() {
    setEncerrando("todas");
    setMsg(null);
    const r = await enviar(() => api<{ encerradas: number }>("/api/v1/sessoes", { metodo: "DELETE" }));
    setEncerrando(null);
    if (r) {
      setMsg(r.encerradas === 1 ? "1 sessão encerrada." : `${r.encerradas} sessões encerradas.`);
      router.refresh();
    }
  }

  return (
    <Painel
      id="sessoes"
      titulo="Onde você está conectado"
      descricao="Não reconhece algum aparelho? Encerre a sessão e troque a senha."
      acao={
        outras > 0 ? (
          <Botao variante="secundario" tamanho="sm" onClick={encerrarOutras} carregando={encerrando === "todas"}>
            Sair dos outros ({outras})
          </Botao>
        ) : null
      }
    >
      <div aria-live="polite">{msg ? <Aviso tom="sucesso" className="mb-4">{msg}</Aviso> : null}</div>
      {erro ? <Aviso tom="erro" className="mb-4">{erro}</Aviso> : null}
      <ul className="grid gap-2">
        {sessoes.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-linha p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-papel text-tinta">
              <Icone nome={s.cliente === "app" ? "celular" : "monitor"} tamanho={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                {descreverAparelho(s)}
                {s.atual ? <Etiqueta tom="verde">Esta sessão</Etiqueta> : null}
              </p>
              <p className="text-sm text-tx2">Entrou em {dataHoraBR(s.created_at)}</p>
            </div>
            {s.atual ? (
              <BotaoSair />
            ) : (
              <Botao variante="fantasma" tamanho="sm" onClick={() => encerrar(s)} carregando={encerrando === s.id}>
                Encerrar
              </Botao>
            )}
          </li>
        ))}
      </ul>
    </Painel>
  );
}
