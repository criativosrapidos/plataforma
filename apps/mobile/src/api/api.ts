// Endpoints tipados com o contrato de @aviso/shared (packages/shared/src/api-types.ts).
import type {
  AcompanhamentoDTO,
  AcompanhandoItemDTO,
  Acesso,
  AjustesDTO,
  AssinaturaDTO,
  AuthResponse,
  AvisoDTO,
  ChecklistItemDTO,
  Ciclo,
  CheckoutRequest,
  CheckoutResponse,
  CompromissoDTO,
  ConcursoDetalheDTO,
  ConcursoResumoDTO,
  HojeResponse,
  MateriasEmComumResponse,
  MeResponse,
  Paginado,
  PerfilDTO,
  PerguntaDTO,
  Plano,
  PlanoInfo,
  UsuarioDTO,
} from "@aviso/shared";
import { http } from "./cliente";

export type PerfilEntrada = Omit<PerfilDTO, "id">;

export interface FiltrosConcursos {
  q?: string;
  uf?: string;
  escolaridade?: string;
  area?: string;
  banca?: string;
  status?: string;
  esfera?: string;
  salario_min?: number;
  abertos?: boolean;
  radar?: boolean;
  ordem?: "recentes" | "salario" | "vagas" | "prazo";
  pagina?: number;
  por_pagina?: number;
}

function query(f: Record<string, unknown>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    p.set(k, v === true ? "1" : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

const id = encodeURIComponent;

export const api = {
  // Conta
  entrar: (email: string, senha: string) => http.post<AuthResponse>("/auth/login", { email, senha, cliente: "app" }),
  cadastrar: (d: { nome: string; email: string; senha: string; aceito_termos: boolean }) =>
    http.post<AuthResponse>("/auth/cadastro", { ...d, cliente: "app" }),
  sair: () => http.post<{ ok: true }>("/auth/sair"),
  me: () => http.get<MeResponse>("/me"),
  atualizarMe: (d: Partial<Pick<UsuarioDTO, "nome" | "telefone" | "whatsapp_optin" | "busca_nominal_optin" | "nome_busca">>) =>
    http.patch<UsuarioDTO>("/me", d),
  excluirConta: () => http.delete<{ ok: true }>("/me"),

  // Planos e assinatura
  planos: () => http.get<{ trialDias: number; planos: PlanoInfo[] }>("/planos"),
  assinatura: () => http.get<{ assinatura: AssinaturaDTO | null; acesso: Acesso; podeTestar: boolean }>("/assinatura"),
  checkout: (d: CheckoutRequest) => http.post<CheckoutResponse>("/assinatura/checkout", d),
  trocarPlano: (plano: Plano, ciclo: Ciclo) => http.post<AssinaturaDTO>("/assinatura/trocar", { plano, ciclo }),

  // Abas
  hoje: () => http.get<HojeResponse>("/hoje"),
  agenda: (de: string, ate: string) => http.get<CompromissoDTO[]>(`/agenda${query({ de, ate })}`),
  materias: () => http.get<MateriasEmComumResponse>("/materias"),
  acompanhando: () => http.get<AcompanhandoItemDTO[]>("/acompanhando"),
  avisos: (limite = 50) => http.get<AvisoDTO[]>(`/avisos${query({ limite })}`),
  marcarLidos: (d: { ids?: string[]; todos?: boolean }) => http.post<{ ok: true }>("/avisos", d),

  // Concursos
  concursos: (f: FiltrosConcursos) => http.get<Paginado<ConcursoResumoDTO>>(`/concursos${query({ ...f })}`),
  concurso: (idOuSlug: string) => http.get<ConcursoDetalheDTO>(`/concursos/${id(idOuSlug)}`),
  acompanhar: (contestId: string, roleId?: string | null) =>
    http.post<AcompanhamentoDTO>(`/concursos/${id(contestId)}/acompanhar`, roleId ? { role_id: roleId } : {}),
  atualizarAcompanhamento: (contestId: string, d: { cor?: string; role_id?: string | null; nas_materias?: boolean }) =>
    http.patch<AcompanhamentoDTO>(`/concursos/${id(contestId)}/acompanhar`, d),
  deixarDeAcompanhar: (contestId: string) => http.delete<{ ok: true }>(`/concursos/${id(contestId)}/acompanhar`),

  // Checklist
  adicionarItem: (contestId: string, texto: string) => http.post<ChecklistItemDTO>(`/concursos/${id(contestId)}/checklist`, { texto }),
  atualizarItem: (itemId: string, d: { feito?: boolean; texto?: string }) => http.patch<ChecklistItemDTO>(`/checklist/${id(itemId)}`, d),
  removerItem: (itemId: string) => http.delete<{ ok: true }>(`/checklist/${id(itemId)}`),

  // Pergunte ao edital
  perguntas: (contestId: string) => http.get<PerguntaDTO[]>(`/concursos/${id(contestId)}/perguntas`),
  perguntar: (contestId: string, pergunta: string) =>
    http.post<PerguntaDTO & { restantes: number }>(`/concursos/${id(contestId)}/perguntas`, { pergunta }),

  // Ajustes e perfis
  salvarAjustes: (d: Partial<AjustesDTO>) => http.patch<AjustesDTO>("/ajustes", d),
  perfis: () => http.get<PerfilDTO[]>("/perfis"),
  criarPerfil: (p: PerfilEntrada) => http.post<PerfilDTO>("/perfis", p),
  atualizarPerfil: (perfilId: string, p: PerfilEntrada) => http.put<PerfilDTO>(`/perfis/${id(perfilId)}`, p),
  removerPerfil: (perfilId: string) => http.delete<{ ok: true }>(`/perfis/${id(perfilId)}`),

  // Push
  registrarDispositivo: (expo_push_token: string, plataforma: "ios" | "android" | "web") =>
    http.post<{ ok: true }>("/dispositivos", { expo_push_token, plataforma }),
  removerDispositivo: (expo_push_token: string) => http.delete<{ ok: true }>("/dispositivos", { expo_push_token }),
};
