import { View } from 'react-native';

import { useCatalogo } from '@/lib/catalogo';
import { exigir, urlsDasFotos, useDados } from '@/lib/dados';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/lib/tipos';
import { espaco } from '@/tema';
import { PostCard } from './post';
import { Aviso, Carregando, Texto } from './ui';

export async function buscarFeed(comunidade?: string) {
  let q = supabase.from('feed').select('*').order('criado_em', { ascending: false }).limit(30);
  if (comunidade) q = q.eq('comunidade_id', comunidade);
  const posts = (await exigir(q)) as Post[];
  const fotos = await urlsDasFotos(posts.map((p) => p.foto_path));
  return { posts, fotos };
}

export function useFeed(comunidade?: string) {
  return useDados(() => buscarFeed(comunidade), comunidade ?? 'todas');
}

export function ListaDoFeed({ dados, carregando, erro }: ReturnType<typeof useFeed>) {
  const { nomeDaComunidade } = useCatalogo();
  if (carregando && !dados) return <Carregando />;
  if (erro) return <Texto cor="perda">{erro}</Texto>;
  if (!dados?.posts.length)
    return <Aviso titulo="Ninguém postou ainda" texto="Os check-ins aparecem aqui, com foto, dia da meta e o valor em jogo." />;
  return (
    <View style={{ gap: espaco[4] }}>
      {dados.posts.map((p) => (
        <PostCard key={p.id} post={p} foto={dados.fotos[p.foto_path]} comunidade={nomeDaComunidade(p.comunidade_id)} />
      ))}
    </View>
  );
}
