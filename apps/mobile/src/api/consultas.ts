// Cache e revalidação (TanStack Query). Atualização otimista no acompanhar, checklist, matérias e ajustes.
import { QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type {
  AcompanhamentoDTO,
  AcompanhandoItemDTO,
  AjustesDTO,
  AvisoDTO,
  ChecklistItemDTO,
  ConcursoDetalheDTO,
  ConcursoResumoDTO,
  HojeResponse,
  MateriasEmComumResponse,
  MeResponse,
  Paginado,
  PerfilDTO,
  PerguntaDTO,
} from "@aviso/shared";
import { api, type FiltrosConcursos, type PerfilEntrada } from "./api";
import { ErroApi } from "./cliente";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: (falhas, e) => {
        if (e instanceof ErroApi && e.status >= 400 && e.status < 500) return false;
        return falhas < 2;
      },
    },
    mutations: { retry: false },
  },
});

export const chaves = {
  me: ["me"] as const,
  hoje: ["hoje"] as const,
  avisos: ["avisos"] as const,
  agenda: (de: string, ate: string) => ["agenda", de, ate] as const,
  materias: ["materias"] as const,
  acompanhando: ["acompanhando"] as const,
  concursos: (f: FiltrosConcursos) => ["concursos", f] as const,
  concurso: (id: string) => ["concurso", id] as const,
  perguntas: (id: string) => ["perguntas", id] as const,
  perfis: ["perfis"] as const,
  planos: ["planos"] as const,
  assinatura: ["assinatura"] as const,
};

// ---------- Leituras ----------

export const useMe = (habilitado = true) => useQuery({ queryKey: chaves.me, queryFn: api.me, enabled: habilitado, staleTime: 15_000 });

export const useHoje = () => useQuery({ queryKey: chaves.hoje, queryFn: api.hoje });
export const useAvisos = () => useQuery({ queryKey: chaves.avisos, queryFn: () => api.avisos(50) });
export const useMaterias = () => useQuery({ queryKey: chaves.materias, queryFn: api.materias });
export const useAcompanhando = () => useQuery({ queryKey: chaves.acompanhando, queryFn: api.acompanhando });
export const usePerfis = () => useQuery({ queryKey: chaves.perfis, queryFn: api.perfis });
export const usePlanos = () => useQuery({ queryKey: chaves.planos, queryFn: api.planos, staleTime: 60 * 60_000 });
export const useAssinatura = () => useQuery({ queryKey: chaves.assinatura, queryFn: api.assinatura });

export const useAgenda = (de: string, ate: string) =>
  useQuery({
    queryKey: chaves.agenda(de, ate),
    queryFn: () => api.agenda(de, ate),
    placeholderData: (anterior) => anterior,
  });

export const useConcurso = (id: string) =>
  useQuery({
    queryKey: chaves.concurso(id),
    queryFn: () => api.concurso(id),
    enabled: !!id,
    initialData: () => resumoEmCache(id) as ConcursoDetalheDTO | undefined,
    initialDataUpdatedAt: 0,
  });

export const usePerguntas = (id: string, habilitado: boolean) =>
  useQuery({ queryKey: chaves.perguntas(id), queryFn: () => api.perguntas(id), enabled: habilitado && !!id });

export const useConcursos = (f: Omit<FiltrosConcursos, "pagina">, habilitado = true) =>
  useInfiniteQuery({
    queryKey: chaves.concursos(f),
    queryFn: ({ pageParam }) => api.concursos({ ...f, pagina: pageParam, por_pagina: 15 }),
    initialPageParam: 1,
    getNextPageParam: (ultima) => (ultima.pagina * ultima.porPagina < ultima.total ? ultima.pagina + 1 : undefined),
    enabled: habilitado,
    placeholderData: (anterior) => anterior,
  });

/** Enquanto o detalhe carrega, mostra o resumo que já está em alguma lista (abre instantâneo). */
function resumoEmCache(id: string): Partial<ConcursoDetalheDTO> | undefined {
  const listas = queryClient.getQueriesData<InfiniteData<Paginado<ConcursoResumoDTO>>>({ queryKey: ["concursos"] });
  for (const [, dados] of listas) {
    const achado = dados?.pages.flatMap((p) => p.itens).find((c) => c.id === id);
    if (achado) return { ...achado, ...vazioDetalhe };
  }
  const acomp = queryClient.getQueryData<AcompanhandoItemDTO[]>(chaves.acompanhando)?.find((a) => a.contest_id === id);
  if (acomp) return { ...acomp.concurso, ...vazioDetalhe, datas: acomp.datas };
  const nov = queryClient.getQueryData<HojeResponse>(chaves.hoje)?.novidades.find((c) => c.id === id);
  if (nov) return { ...nov, ...vazioDetalhe };
  return undefined;
}

const vazioDetalhe = {
  resumo: null,
  numero_edital: null,
  taxa_centavos: null,
  cargos: [],
  datas: [],
  materias: [],
  versoes: [],
  tem_edital_texto: false,
  acompanhamento: null,
  _parcial: true,
};

/** true quando o detalhe ainda é só o resumo da lista. */
export function ehParcial(c: ConcursoDetalheDTO | undefined): boolean {
  return !!c && "_parcial" in c;
}

// ---------- Helpers de cache ----------

function mexerNoResumo(qc: QueryClient, contestId: string, fn: (c: ConcursoResumoDTO) => ConcursoResumoDTO) {
  qc.setQueriesData<InfiniteData<Paginado<ConcursoResumoDTO>>>({ queryKey: ["concursos"] }, (old) =>
    old ? { ...old, pages: old.pages.map((p) => ({ ...p, itens: p.itens.map((c) => (c.id === contestId ? fn(c) : c)) })) } : old,
  );
  qc.setQueryData<HojeResponse>(chaves.hoje, (old) =>
    old ? { ...old, novidades: old.novidades.map((c) => (c.id === contestId ? fn(c) : c)) } : old,
  );
  qc.setQueryData<ConcursoDetalheDTO>(chaves.concurso(contestId), (old) => (old ? ({ ...old, ...fn(old) } as ConcursoDetalheDTO) : old));
}

function mexerNoAcompanhamento(qc: QueryClient, contestId: string, fn: (a: AcompanhamentoDTO) => AcompanhamentoDTO) {
  qc.setQueryData<ConcursoDetalheDTO>(chaves.concurso(contestId), (old) =>
    old?.acompanhamento ? { ...old, acompanhamento: fn(old.acompanhamento) } : old,
  );
  qc.setQueryData<AcompanhandoItemDTO[]>(chaves.acompanhando, (old) =>
    old?.map((a) => (a.contest_id === contestId ? ({ ...a, ...fn(a) } as AcompanhandoItemDTO) : a)),
  );
}

type Retrato = [readonly unknown[], unknown][];

async function retrato(qc: QueryClient, chavesAfetadas: readonly (readonly unknown[])[]): Promise<Retrato> {
  await Promise.all(chavesAfetadas.map((k) => qc.cancelQueries({ queryKey: k })));
  return chavesAfetadas.flatMap((k) => qc.getQueriesData({ queryKey: k }));
}

function restaurar(qc: QueryClient, r: Retrato | undefined) {
  r?.forEach(([k, v]) => qc.setQueryData(k, v));
}

/** Tudo que muda quando a pessoa passa a acompanhar (ou deixa) um concurso. */
function invalidarAcompanhamento(qc: QueryClient, contestId: string) {
  qc.invalidateQueries({ queryKey: chaves.concurso(contestId) });
  qc.invalidateQueries({ queryKey: chaves.acompanhando });
  qc.invalidateQueries({ queryKey: chaves.hoje });
  qc.invalidateQueries({ queryKey: ["agenda"] });
  qc.invalidateQueries({ queryKey: chaves.materias });
  qc.invalidateQueries({ queryKey: chaves.me });
  qc.invalidateQueries({ queryKey: ["concursos"] });
}

// ---------- Acompanhar ----------

export function useAcompanhar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { contestId: string; roleId?: string | null }) => api.acompanhar(v.contestId, v.roleId),
    onMutate: async ({ contestId }) => {
      const r = await retrato(qc, [["concursos"], chaves.hoje, chaves.concurso(contestId)]);
      mexerNoResumo(qc, contestId, (c) => ({ ...c, acompanhando: true }));
      return r;
    },
    onSuccess: (acomp, { contestId }) => {
      qc.setQueryData<ConcursoDetalheDTO>(chaves.concurso(contestId), (old) =>
        old ? { ...old, acompanhando: true, acompanhamento: acomp } : old,
      );
    },
    onError: (_e, _v, r) => restaurar(qc, r),
    onSettled: (_d, _e, { contestId }) => invalidarAcompanhamento(qc, contestId),
  });
}

export function useDeixarDeAcompanhar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contestId: string) => api.deixarDeAcompanhar(contestId),
    onMutate: async (contestId) => {
      const r = await retrato(qc, [["concursos"], chaves.hoje, chaves.concurso(contestId), chaves.acompanhando]);
      mexerNoResumo(qc, contestId, (c) => ({ ...c, acompanhando: false }));
      qc.setQueryData<ConcursoDetalheDTO>(chaves.concurso(contestId), (old) => (old ? { ...old, acompanhamento: null } : old));
      qc.setQueryData<AcompanhandoItemDTO[]>(chaves.acompanhando, (old) => old?.filter((a) => a.contest_id !== contestId));
      return r;
    },
    onError: (_e, _v, r) => restaurar(qc, r),
    onSettled: (_d, _e, contestId) => invalidarAcompanhamento(qc, contestId),
  });
}

export function useAtualizarAcompanhamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { contestId: string; dados: { cor?: string; role_id?: string | null; nas_materias?: boolean } }) =>
      api.atualizarAcompanhamento(v.contestId, v.dados),
    onMutate: async ({ contestId, dados }) => {
      const r = await retrato(qc, [chaves.concurso(contestId), chaves.acompanhando, chaves.materias]);
      mexerNoAcompanhamento(qc, contestId, (a) => ({ ...a, ...dados }));
      if (dados.nas_materias !== undefined) {
        qc.setQueryData<MateriasEmComumResponse>(chaves.materias, (old) =>
          old
            ? { ...old, concursos: old.concursos.map((c) => (c.contest_id === contestId ? { ...c, ativo: dados.nas_materias! } : c)) }
            : old,
        );
      }
      if (dados.cor) {
        qc.setQueryData<MateriasEmComumResponse>(chaves.materias, (old) =>
          old ? { ...old, concursos: old.concursos.map((c) => (c.contest_id === contestId ? { ...c, cor: dados.cor! } : c)) } : old,
        );
      }
      return r;
    },
    onError: (_e, _v, r) => restaurar(qc, r),
    onSettled: (_d, _e, { contestId, dados }) => {
      qc.invalidateQueries({ queryKey: chaves.acompanhando });
      qc.invalidateQueries({ queryKey: chaves.concurso(contestId) });
      if (dados.nas_materias !== undefined || dados.role_id !== undefined || dados.cor) qc.invalidateQueries({ queryKey: chaves.materias });
      if (dados.cor) {
        qc.invalidateQueries({ queryKey: chaves.hoje });
        qc.invalidateQueries({ queryKey: ["agenda"] });
      }
    },
  });
}

// ---------- Checklist ----------

function mexerNoChecklist(qc: QueryClient, contestId: string, fn: (itens: ChecklistItemDTO[]) => ChecklistItemDTO[]) {
  mexerNoAcompanhamento(qc, contestId, (a) => ({ ...a, checklist: fn(a.checklist) }));
}

export function useChecklist(contestId: string) {
  const qc = useQueryClient();
  const chavesAfetadas = [chaves.concurso(contestId), chaves.acompanhando] as const;

  const marcar = useMutation({
    mutationFn: (v: { itemId: string; feito: boolean }) => api.atualizarItem(v.itemId, { feito: v.feito }),
    onMutate: async ({ itemId, feito }) => {
      const r = await retrato(qc, chavesAfetadas);
      mexerNoChecklist(qc, contestId, (itens) => itens.map((i) => (i.id === itemId ? { ...i, feito } : i)));
      return r;
    },
    onError: (_e, _v, r) => restaurar(qc, r),
  });

  const adicionar = useMutation({
    mutationFn: (texto: string) => api.adicionarItem(contestId, texto),
    onMutate: async (texto) => {
      const r = await retrato(qc, chavesAfetadas);
      const temp: ChecklistItemDTO = { id: `temp-${Date.now()}`, texto, feito: false, ordem: 999 };
      mexerNoChecklist(qc, contestId, (itens) => [...itens, temp]);
      return { r, tempId: temp.id };
    },
    onSuccess: (item, _t, ctx) => {
      mexerNoChecklist(qc, contestId, (itens) => itens.map((i) => (i.id === ctx?.tempId ? item : i)));
    },
    onError: (_e, _v, ctx) => restaurar(qc, ctx?.r),
  });

  const remover = useMutation({
    mutationFn: (itemId: string) => api.removerItem(itemId),
    onMutate: async (itemId) => {
      const r = await retrato(qc, chavesAfetadas);
      mexerNoChecklist(qc, contestId, (itens) => itens.filter((i) => i.id !== itemId));
      return r;
    },
    onError: (_e, _v, r) => restaurar(qc, r),
  });

  return { marcar, adicionar, remover };
}

// ---------- Pergunte ao edital ----------

export function usePerguntar(contestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pergunta: string) => api.perguntar(contestId, pergunta),
    onSuccess: (p) => {
      qc.setQueryData<PerguntaDTO[]>(chaves.perguntas(contestId), (old) => [...(old ?? []), p]);
      qc.setQueryData<MeResponse>(chaves.me, (old) =>
        old ? { ...old, uso: { ...old.uso, perguntasMes: old.uso.perguntasMes + 1 } } : old,
      );
    },
    onError: (e) => {
      if (e instanceof ErroApi && e.limiteMes) {
        qc.setQueryData<MeResponse>(chaves.me, (old) =>
          old ? { ...old, uso: { ...old.uso, perguntasMes: old.uso.limites.perguntasMes } } : old,
        );
      }
    },
  });
}

// ---------- Ajustes, avisos, perfis ----------

export function useSalvarAjustes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<AjustesDTO>) => api.salvarAjustes(d),
    onMutate: async (d) => {
      const r = await retrato(qc, [chaves.me]);
      qc.setQueryData<MeResponse>(chaves.me, (old) => (old ? { ...old, ajustes: { ...old.ajustes, ...d } } : old));
      return r;
    },
    onSuccess: (ajustes) => qc.setQueryData<MeResponse>(chaves.me, (old) => (old ? { ...old, ajustes } : old)),
    onError: (_e, _v, r) => restaurar(qc, r),
  });
}

export function useMarcarLidos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { ids?: string[]; todos?: boolean }) => api.marcarLidos(d),
    onMutate: async (d) => {
      const r = await retrato(qc, [chaves.avisos, chaves.hoje, chaves.me]);
      const lido = (a: AvisoDTO) => (d.todos || d.ids?.includes(a.id) ? { ...a, lido: true } : a);
      qc.setQueryData<AvisoDTO[]>(chaves.avisos, (old) => old?.map(lido));
      qc.setQueryData<HojeResponse>(chaves.hoje, (old) => (old ? { ...old, avisos: old.avisos.map(lido) } : old));
      qc.setQueryData<MeResponse>(chaves.me, (old) => {
        if (!old) return old;
        const n = d.todos ? 0 : Math.max(0, old.contagens.avisosNaoLidos - (d.ids?.length ?? 0));
        return { ...old, contagens: { ...old.contagens, avisosNaoLidos: n } };
      });
      return r;
    },
    onError: (_e, _v, r) => restaurar(qc, r),
    onSettled: () => qc.invalidateQueries({ queryKey: chaves.me }),
  });
}

export function useSalvarPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; perfil: PerfilEntrada }) => (v.id ? api.atualizarPerfil(v.id, v.perfil) : api.criarPerfil(v.perfil)),
    onSuccess: (p) => {
      qc.setQueryData<PerfilDTO[]>(chaves.perfis, (old) =>
        old ? (old.some((x) => x.id === p.id) ? old.map((x) => (x.id === p.id ? p : x)) : [...old, p]) : old,
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chaves.perfis });
      qc.invalidateQueries({ queryKey: chaves.me });
      qc.invalidateQueries({ queryKey: chaves.hoje });
    },
  });
}

export function useRemoverPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removerPerfil(id),
    onMutate: async (id) => {
      const r = await retrato(qc, [chaves.perfis]);
      qc.setQueryData<PerfilDTO[]>(chaves.perfis, (old) => old?.filter((p) => p.id !== id));
      return r;
    },
    onError: (_e, _v, r) => restaurar(qc, r),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chaves.perfis });
      qc.invalidateQueries({ queryKey: chaves.me });
      qc.invalidateQueries({ queryKey: chaves.hoje });
    },
  });
}
