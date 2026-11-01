"use client";

import { useCallback, useState } from "react";

/** Erro devolvido pela API no formato { erro: { codigo, mensagem, campos } }. */
export class FalhaApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensagem: string,
    public campos: Record<string, string> = {},
  ) {
    super(mensagem);
  }
}

/** Chama a API do próprio site (cookie de sessão vai junto). */
export async function api<T = unknown>(caminho: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const metodo = opcoes.metodo ?? (opcoes.corpo === undefined ? "GET" : "POST");
  let r: Response;
  try {
    r = await fetch(caminho, {
      method: metodo,
      headers: opcoes.corpo === undefined ? undefined : { "content-type": "application/json" },
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new FalhaApi(0, "sem_conexao", "Sem conexão. Confira sua internet e tente de novo.");
  }
  const dados = await r.json().catch(() => null);
  if (!r.ok) {
    const e = (dados as { erro?: { codigo?: string; mensagem?: string; campos?: Record<string, string> } } | null)?.erro;
    throw new FalhaApi(r.status, e?.codigo ?? "erro", e?.mensagem ?? "Algo deu errado. Tente de novo.", e?.campos ?? {});
  }
  return dados as T;
}

/** Estado de envio de formulário: carregando, mensagem geral e erros por campo. */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});

  const enviar = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setEnviando(true);
    setErro(null);
    setCampos({});
    try {
      return await fn();
    } catch (e) {
      if (e instanceof FalhaApi) {
        setErro(e.message);
        setCampos(e.campos);
      } else {
        setErro("Algo deu errado. Tente de novo.");
      }
      return undefined;
    } finally {
      setEnviando(false);
    }
  }, []);

  const limpar = useCallback(() => {
    setErro(null);
    setCampos({});
  }, []);

  /** Marca erros de validação feitos no próprio navegador. Devolve true se houver algum. */
  const validar = useCallback((erros: Record<string, string | false | null | undefined>) => {
    const ativos = Object.fromEntries(Object.entries(erros).filter(([, v]) => !!v)) as Record<string, string>;
    setCampos(ativos);
    setErro(Object.keys(ativos).length ? "Confira os campos destacados." : null);
    return Object.keys(ativos).length > 0;
  }, []);

  return { enviando, erro, campos, enviar, limpar, validar, setErro };
}
