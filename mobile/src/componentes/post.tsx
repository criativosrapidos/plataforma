import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { haQuanto, reais } from '@/lib/formato';
import { useEu } from '@/lib/sessao';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/lib/tipos';
import { espaco, raio, useCores } from '@/tema';
import { Avatar, Botao, Cartao, Selo, Texto } from './ui';

export function PostCard({ post, foto, comunidade }: { post: Post; foto?: string; comunidade?: string }) {
  const c = useCores();
  const eu = useEu();
  const [apoiei, setApoiei] = useState(post.apoiei);
  const [apoios, setApoios] = useState(post.apoios);
  const total = post.semanas * 7;

  async function apoiar() {
    const novo = !apoiei;
    setApoiei(novo);
    setApoios((n) => n + (novo ? 1 : -1));
    const { error } = novo
      ? await supabase.from('apoios').insert({ checkin_id: post.id })
      : await supabase.from('apoios').delete().eq('checkin_id', post.id).eq('user_id', eu);
    if (error) {
      setApoiei(!novo);
      setApoios((n) => n + (novo ? -1 : 1));
    }
  }

  return (
    <Cartao>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
        <Avatar nome={post.nome} />
        <View style={{ flex: 1 }}>
          <Texto v="corpoForte">{post.nome}</Texto>
          <Texto v="legenda">{[comunidade, haQuanto(post.criado_em)].filter(Boolean).join(' · ')}</Texto>
        </View>
        <Selo estado={post.status === 'pendente' ? 'aguardando' : 'em-dia'} />
      </View>
      <Texto>
        {post.titulo}. Dia {post.dia_da_meta} de {total}.{post.texto ? ` ${post.texto}` : ''}
      </Texto>
      {foto ? (
        <Image
          source={{ uri: foto }}
          contentFit="cover"
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: raio.sm, backgroundColor: c.focoSuave }}
          accessibilityLabel={`Foto do check-in de ${post.nome}`}
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto v="valor">{reais(post.valor_centavos)} em jogo</Texto>
        <Botao
          pequeno
          tipo={apoiei ? 'principal' : 'secundario'}
          titulo={apoios > 0 ? `Apoiar · ${apoios}` : 'Apoiar'}
          onPress={apoiar}
        />
      </View>
    </Cartao>
  );
}
