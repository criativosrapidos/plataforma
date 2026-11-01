// Sessão: token, dados da conta (/me) e em que etapa do app a pessoa está.
// Sem plano grátis: sem teste ativo nem assinatura em dia, só a tela de planos.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { MeResponse } from "@aviso/shared";
import { api } from "@/api/api";
import { aoErroGlobal, definirToken, ErroApi } from "@/api/cliente";
import { chaves, useMe } from "@/api/consultas";
import { apagar, CHAVES, gravar, ler } from "@/lib/armazenamento";

/**
 * carregando → lendo token / buscando /me
 * publico    → boas-vindas, entrar, criar conta
 * perfil     → assistente do perfil de busca (logo depois do cadastro, ou depois do teste se não tiver perfil)
 * planos     → paywall (sem teste nem assinatura em dia)
 * app        → abas
 * offline    → tem token mas não conseguiu falar com o servidor
 */
export type Etapa = "carregando" | "publico" | "perfil" | "planos" | "app" | "offline";

interface ContextoSessao {
  etapa: Etapa;
  me: MeResponse | undefined;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (d: { nome: string; email: string; senha: string }) => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: () => Promise<void>;
  pularPerfil: () => void;
  concluirCadastro: () => void;
  tentarDeNovo: () => void;
  /** Função chamada antes de sair (ex.: desregistrar o token de push). */
  registrarAoSair: (f: () => Promise<void>) => void;
}

const Contexto = createContext<ContextoSessao | null>(null);

export function useSessao() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useSessao fora do ProvedorSessao");
  return c;
}

let antesDeSair: (() => Promise<void>) | null = null;

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [pronto, setPronto] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [novoCadastro, setNovoCadastro] = useState(false);
  const [perfilPulado, setPerfilPulado] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, np, pp] = await Promise.all([ler(CHAVES.token), ler(CHAVES.novoCadastro), ler(CHAVES.perfilPulado)]);
      definirToken(t);
      setToken(t);
      setNovoCadastro(np === "1");
      setPerfilPulado(pp === "1");
      setPronto(true);
    })();
  }, []);

  const limpar = useCallback(async () => {
    definirToken(null);
    setToken(null);
    setNovoCadastro(false);
    setPerfilPulado(false);
    await Promise.all([apagar(CHAVES.token), apagar(CHAVES.novoCadastro), apagar(CHAVES.perfilPulado)]);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    aoErroGlobal({
      naoAutenticado: () => void limpar(),
      assinaturaNecessaria: () => void qc.invalidateQueries({ queryKey: chaves.me }),
    });
  }, [limpar, qc]);

  const me = useMe(pronto && !!token);

  const iniciar = useCallback(
    async (t: string, cadastro: boolean) => {
      qc.clear();
      definirToken(t);
      await gravar(CHAVES.token, t);
      if (cadastro) await gravar(CHAVES.novoCadastro, "1");
      setNovoCadastro(cadastro);
      setPerfilPulado(false);
      await qc.fetchQuery({ queryKey: chaves.me, queryFn: api.me });
      setToken(t);
    },
    [qc],
  );

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const r = await api.entrar(email, senha);
      await iniciar(r.token, false);
    },
    [iniciar],
  );

  const cadastrar = useCallback(
    async (d: { nome: string; email: string; senha: string }) => {
      const r = await api.cadastrar({ ...d, aceito_termos: true });
      await iniciar(r.token, true);
    },
    [iniciar],
  );

  const sair = useCallback(async () => {
    try {
      await antesDeSair?.();
    } catch {
      /* segue */
    }
    try {
      await api.sair();
    } catch {
      /* sessão já pode ter expirado */
    }
    await limpar();
  }, [limpar]);

  const excluirConta = useCallback(async () => {
    try {
      await antesDeSair?.();
    } catch {
      /* segue */
    }
    await api.excluirConta();
    await limpar();
  }, [limpar]);

  const pularPerfil = useCallback(() => {
    setPerfilPulado(true);
    void gravar(CHAVES.perfilPulado, "1");
  }, []);

  const dados = me.data;
  const etapa: Etapa = useMemo(() => {
    if (!pronto) return "carregando";
    if (!token) return "publico";
    if (!dados) {
      if (me.isError && !(me.error instanceof ErroApi && me.error.status === 401)) return "offline";
      return "carregando";
    }
    const precisaPerfil = dados.contagens.perfis === 0 && !perfilPulado;
    if (!dados.acesso.liberado) return precisaPerfil && novoCadastro ? "perfil" : "planos";
    return precisaPerfil ? "perfil" : "app";
  }, [pronto, token, dados, me.isError, me.error, perfilPulado, novoCadastro]);

  /** O fluxo de cadastro termina quando a pessoa começa o teste (ou assina). */
  const concluirCadastro = useCallback(() => {
    setNovoCadastro(false);
    void apagar(CHAVES.novoCadastro);
  }, []);

  const valor = useMemo<ContextoSessao>(
    () => ({
      etapa,
      me: dados,
      entrar,
      cadastrar,
      sair,
      excluirConta,
      pularPerfil,
      concluirCadastro,
      tentarDeNovo: () => void me.refetch(),
      registrarAoSair: (f) => {
        antesDeSair = f;
      },
    }),
    [etapa, dados, entrar, cadastrar, sair, excluirConta, pularPerfil, concluirCadastro, me],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
