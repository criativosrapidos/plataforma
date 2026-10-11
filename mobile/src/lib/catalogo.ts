import { useEffect, useState } from 'react';

import { supabase } from './supabase';
import type { Comunidade, Instituicao } from './tipos';

let cache: Promise<{ comunidades: Comunidade[]; instituicoes: Instituicao[] }> | null = null;

function carregar() {
  cache ??= Promise.all([
    supabase.from('comunidades').select('*').order('ordem'),
    supabase.from('instituicoes').select('id, nome, descricao').order('nome'),
  ]).then(([c, i]) => {
    if (c.error || i.error) {
      cache = null;
      throw c.error ?? i.error;
    }
    return { comunidades: c.data as Comunidade[], instituicoes: i.data as Instituicao[] };
  });
  return cache;
}

// Comunidades e instituições mudam pouco: carrega uma vez por sessão do app.
export function useCatalogo() {
  const [dados, setDados] = useState<Awaited<ReturnType<typeof carregar>> | null>(null);
  useEffect(() => {
    carregar().then(setDados).catch(() => setDados({ comunidades: [], instituicoes: [] }));
  }, []);
  const nomeDaComunidade = (id: string) => dados?.comunidades.find((c) => c.id === id)?.nome ?? '';
  return { ...dados, nomeDaComunidade };
}
