import "./ambiente";
import { mock } from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "@/lib/db";
import { slugify, type PerfilBusca } from "@aviso/shared";
import { MATERIAS_CANONICAS } from "../../db/subjects";

/** Recria o schema do banco de teste, aplica todas as migrações e a base mínima (matérias e fontes). */
export async function prepararBanco() {
  await sql.unsafe("drop schema if exists public cascade; create schema public;");
  const dir = path.join(__dirname, "..", "..", "db", "migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    await sql.unsafe(readFileSync(path.join(dir, f), "utf8"));
  }
  for (const m of MATERIAS_CANONICAS) {
    await sql`insert into subjects (nome, slug, sinonimos) values (${m.nome}, ${slugify(m.nome)}, ${m.sinonimos}) on conflict do nothing`;
  }
  const fontes = [
    { slug: "dou", nome: "Diário Oficial da União (INLABS)", tipo: "dou", url: "https://inlabs.in.gov.br", freq: 1440, config: { secoes: ["DO1", "DO2", "DO3"] } },
    { slug: "querido-diario", nome: "Querido Diário", tipo: "querido_diario", url: "https://queridodiario.ok.org.br/api", freq: 360, config: { termos: ["concurso público", "edital de abertura", "processo seletivo"] } },
    { slug: "cebraspe", nome: "Cebraspe", tipo: "banca", url: "https://www.cebraspe.org.br/concursos", freq: 60, config: {} },
  ];
  for (const f of fontes) {
    await sql`insert into sources (slug, nome, tipo, url, frequencia_min, config) values (${f.slug}, ${f.nome}, ${f.tipo}, ${f.url}, ${f.freq}, ${sql.json(f.config)})`;
  }
}

export async function fecharBanco() {
  await sql.end({ timeout: 5 });
}

export interface NovoUsuario {
  nome: string;
  email: string;
  plano?: "aviso" | "aprovado" | null;
  status?: "trial" | "ativa" | "inadimplente" | "cancelada" | "expirada";
  trialEndsAt?: Date | null;
  periodEnd?: Date | null;
  telefone?: string | null;
  whatsappOptin?: boolean;
  whatsappOn?: boolean;
  pushOn?: boolean;
  silencio?: [string, string] | null;
  antecedencia?: 1 | 2 | 3 | 5;
  perfil?: Partial<PerfilBusca> | null;
  nomeBusca?: string | null;
  buscaNominal?: boolean;
  providerSubscriptionId?: string | null;
}

/** Cria pessoa + ajustes + (opcional) assinatura e perfil. Devolve o id. */
export async function criarUsuario(u: NovoUsuario): Promise<string> {
  const [r] = await sql<{ id: string }[]>`
    insert into users (nome, email, senha_hash, telefone, whatsapp_optin, whatsapp_optin_em, nome_busca, busca_nominal_optin, termos_aceitos_em)
    values (${u.nome}, ${u.email}, 'x', ${u.telefone ?? null}, ${!!u.whatsappOptin}, ${u.whatsappOptin ? new Date() : null},
            ${u.nomeBusca ?? null}, ${!!u.buscaNominal}, now())
    returning id`;
  await sql`insert into user_settings (user_id, push_on, whatsapp_on, antecedencia_dias, silencio_inicio, silencio_fim)
            values (${r.id}, ${u.pushOn ?? true}, ${!!u.whatsappOn}, ${u.antecedencia ?? 3},
                    ${u.silencio === null ? null : (u.silencio?.[0] ?? "22:00")}::time, ${u.silencio === null ? null : (u.silencio?.[1] ?? "07:00")}::time)`;
  if (u.plano) {
    const status = u.status ?? "trial";
    await sql`insert into subscriptions (user_id, plano, ciclo, status, metodo, trial_ends_at, current_period_end, provider, provider_subscription_id)
              values (${r.id}, ${u.plano}, 'mensal', ${status}, 'pix_automatico', ${u.trialEndsAt ?? null}, ${u.periodEnd ?? u.trialEndsAt ?? null},
                      ${u.providerSubscriptionId ? "asaas" : "mock"}, ${u.providerSubscriptionId ?? null})`;
  }
  if (u.perfil !== null && u.perfil !== undefined) {
    const p = u.perfil;
    await sql`insert into profiles (user_id, nome, escolaridades, areas, cargos, ufs, incluir_nacional, salario_min_centavos, bancas, palavras_chave)
              values (${r.id}, 'Perfil', ${p.escolaridades ?? []}::text[], ${p.areas ?? []}::text[], ${p.cargos ?? []}::text[], ${p.ufs ?? []}::text[],
                      ${p.incluir_nacional ?? true}, ${p.salario_min_centavos ?? null}, ${p.bancas ?? []}::text[], ${p.palavras_chave ?? []}::text[])`;
  }
  return r.id;
}

export async function criarAparelho(userId: string, token: string) {
  const [d] = await sql<{ id: string }[]>`insert into devices (user_id, expo_push_token, plataforma) values (${userId}, ${token}, 'android') returning id`;
  return d.id;
}

export async function acompanhar(userId: string, contestId: string) {
  await sql`insert into follows (user_id, contest_id) values (${userId}, ${contestId}) on conflict do nothing`;
}

/** Instante no horário de Brasília (UTC-3). */
export function br(dataHora: string): Date {
  return new Date(`${dataHora}-03:00`);
}

export interface ChamadaFetch {
  url: string;
  metodo: string;
  corpo: unknown;
  headers: Record<string, string>;
}

/**
 * Simula o fetch global. `responder` recebe a chamada e devolve { status, json }.
 * Devolve a lista de chamadas para conferência.
 */
export function simularFetch(responder: (c: ChamadaFetch) => { status?: number; json: unknown }) {
  const chamadas: ChamadaFetch[] = [];
  mock.method(globalThis, "fetch", async (entrada: string | URL | Request, init?: RequestInit) => {
    const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.toString() : entrada.url;
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((v, k) => (headers[k] = v));
    let corpo: unknown = init?.body ?? null;
    if (typeof corpo === "string") {
      try {
        corpo = JSON.parse(corpo);
      } catch {
        /* texto */
      }
    }
    const c = { url, metodo: init?.method ?? "GET", corpo, headers };
    chamadas.push(c);
    const r = responder(c);
    return new Response(JSON.stringify(r.json), { status: r.status ?? 200, headers: { "content-type": "application/json" } });
  });
  return chamadas;
}

/** Respostas padrão do Expo e do WhatsApp (tudo ok). */
export function respostaPadrao(c: ChamadaFetch): { status?: number; json: unknown } {
  if (c.url.includes("exp.host") && c.url.endsWith("/send")) {
    const msgs = c.corpo as { to: string }[];
    return { json: { data: msgs.map((m, i) => (m.to.includes("Invalido") ? { status: "error", message: "not registered", details: { error: "DeviceNotRegistered" } } : { status: "ok", id: `ticket-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}` })) } };
  }
  if (c.url.includes("graph.facebook.com")) return { json: { messaging_product: "whatsapp", messages: [{ id: `wamid.${Math.random().toString(36).slice(2)}` }] } };
  return { status: 404, json: { erro: "não simulado" } };
}
