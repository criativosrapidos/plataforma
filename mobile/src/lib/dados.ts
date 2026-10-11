// Busca de dados com estado de carregamento e recarga ao voltar para a tela.
// `chave` identifica a busca: quando muda (outra meta, outro filtro), busca de novo.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase, mensagemDeErro } from './supabase';

export function useDados<T>(buscar: () => Promise<T>, chave: string) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const ref = useRef(buscar);
  useEffect(() => {
    ref.current = buscar;
  });

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      setDados(await ref.current());
      setErro(null);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      recarregar();
      // `chave` não é lida aqui de propósito: só serve para buscar de novo quando muda.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recarregar, chave]),
  );

  return { dados, erro, carregando, recarregar };
}

// Lança o erro do Supabase em vez de devolvê-lo.
export async function exigir<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<NonNullable<T>> {
  const { data, error } = await p;
  if (error) throw error;
  return data as NonNullable<T>;
}

export async function urlsDasFotos(caminhos: string[]): Promise<Record<string, string>> {
  const unicos = [...new Set(caminhos)];
  if (!unicos.length) return {};
  const { data } = await supabase.storage.from('checkins').createSignedUrls(unicos, 60 * 60);
  return Object.fromEntries((data ?? []).flatMap((d) => (d.signedUrl && d.path ? [[d.path, d.signedUrl]] : [])));
}
