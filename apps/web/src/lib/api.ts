import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { sessaoAtual, type SessaoUsuario } from "@/lib/auth/session";
import { acessoDoUsuario } from "@/lib/repo/assinaturas";
import { temRecurso, type Acesso, type Recurso } from "@aviso/shared";

export class ErroApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensagem: string,
    public campos?: Record<string, string>,
  ) {
    super(mensagem);
  }
}

export const naoAutenticado = () => new ErroApi(401, "nao_autenticado", "Entre na sua conta para continuar.");
export const semAcesso = (m = "Seu plano não inclui este recurso.") => new ErroApi(403, "sem_acesso", m);
export const naoEncontrado = (m = "Não encontrado.") => new ErroApi(404, "nao_encontrado", m);

export function ok<T>(dados: T, status = 200) {
  return NextResponse.json(dados, { status });
}

/** Envolve um handler: trata ErroApi e ZodError com o formato padrão. */
export function rota<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ErroApi) {
        return NextResponse.json({ erro: { codigo: e.codigo, mensagem: e.message, campos: e.campos } }, { status: e.status });
      }
      if (e instanceof ZodError) {
        const campos: Record<string, string> = {};
        for (const i of e.issues) campos[i.path.join(".") || "_"] = i.message;
        return NextResponse.json({ erro: { codigo: "invalido", mensagem: "Confira os campos.", campos } }, { status: 422 });
      }
      console.error(e);
      return NextResponse.json({ erro: { codigo: "erro_interno", mensagem: "Algo deu errado. Tente de novo." } }, { status: 500 });
    }
  };
}

export async function lerJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    throw new ErroApi(400, "json_invalido", "Corpo da requisição inválido.");
  }
  return schema.parse(corpo);
}

export async function exigirUsuario(): Promise<SessaoUsuario> {
  const s = await sessaoAtual();
  if (!s) throw naoAutenticado();
  return s;
}

/** Usuário logado + teste/assinatura em dia (sem plano grátis). */
export async function exigirAcesso(recurso: Recurso = "app"): Promise<{ usuario: SessaoUsuario; acesso: Acesso }> {
  const usuario = await exigirUsuario();
  const acesso = await acessoDoUsuario(usuario.id);
  if (!acesso.liberado) throw new ErroApi(402, "assinatura_necessaria", "Escolha um plano para continuar. Teste 3 dias grátis.");
  if (!temRecurso(acesso, recurso)) throw semAcesso("Recurso do plano Aprovado.");
  return { usuario, acesso };
}

export async function exigirAdminApi(nivel: "editor" | "admin" = "editor"): Promise<SessaoUsuario> {
  const u = await exigirUsuario();
  const ok = nivel === "editor" ? u.role !== "user" : u.role === "admin";
  if (!ok) throw semAcesso("Acesso restrito à equipe.");
  return u;
}
