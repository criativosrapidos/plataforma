// Cliente HTTP da API /api/v1. Token em Authorization: Bearer.
// Erros vêm como { erro: { codigo, mensagem, campos? } }.
import type { ApiErro } from "@aviso/shared";
import { API_URL } from "@/lib/config";

export class ErroApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensagem: string,
    public campos?: Record<string, string>,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
  /** 402: sem teste nem assinatura em dia → tela de planos. */
  get precisaPlano() {
    return this.status === 402 || this.codigo === "assinatura_necessaria";
  }
  /** 403: recurso do plano Aprovado → upsell. */
  get soAprovado() {
    return this.status === 403 && this.codigo === "sem_acesso";
  }
  /** 429: acabou a cota do mês. */
  get limiteMes() {
    return this.status === 429;
  }
  get semConexao() {
    return this.status === 0;
  }
}

type Ouvintes = {
  naoAutenticado?: () => void;
  assinaturaNecessaria?: () => void;
};

let token: string | null = null;
const ouvintes: Ouvintes = {};

export function definirToken(t: string | null) {
  token = t;
}

export function aoErroGlobal(o: Ouvintes) {
  Object.assign(ouvintes, o);
}

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function requisicao<T>(metodo: Metodo, caminho: string, corpo?: unknown, sinal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (corpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: sinal,
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new ErroApi(0, "sem_conexao", "Sem conexão. Confira a internet e tente de novo.");
  }

  const texto = await res.text();
  let dados: unknown = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }
  }

  if (!res.ok) {
    const e = (dados as ApiErro | null)?.erro;
    const erro = new ErroApi(
      res.status,
      e?.codigo ?? "erro_http",
      e?.mensagem ?? (res.status >= 500 ? "Algo deu errado do nosso lado. Tente de novo." : "Não deu certo. Tente de novo."),
      e?.campos,
    );
    if (res.status === 401 && token) ouvintes.naoAutenticado?.();
    if (erro.precisaPlano) ouvintes.assinaturaNecessaria?.();
    throw erro;
  }
  return dados as T;
}

export const http = {
  get: <T>(c: string, sinal?: AbortSignal) => requisicao<T>("GET", c, undefined, sinal),
  post: <T>(c: string, corpo?: unknown) => requisicao<T>("POST", c, corpo ?? {}),
  put: <T>(c: string, corpo?: unknown) => requisicao<T>("PUT", c, corpo ?? {}),
  patch: <T>(c: string, corpo?: unknown) => requisicao<T>("PATCH", c, corpo ?? {}),
  delete: <T>(c: string, corpo?: unknown) => requisicao<T>("DELETE", c, corpo),
};

/** Mensagem amigável para mostrar num toast. */
export function mensagemDeErro(e: unknown): string {
  if (e instanceof ErroApi) return e.message;
  return "Algo deu errado. Tente de novo.";
}
