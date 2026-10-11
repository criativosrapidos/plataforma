import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Carregando, Cartao, Tela, Texto } from '@/componentes/ui';
import { useCatalogo } from '@/lib/catalogo';
import { espaco } from '@/tema';

export default function Comunidades() {
  const { comunidades } = useCatalogo();
  return (
    <Tela topo>
      <View style={{ gap: espaco[2] }}>
        <Texto v="tituloL">Comunidades</Texto>
        <Texto cor="tintaSuave">Escolha a sua, veja quem está tentando e se comprometa também.</Texto>
      </View>
      {!comunidades ? <Carregando /> : null}
      {comunidades?.map((c) => (
        <Pressable key={c.id} onPress={() => router.push({ pathname: '/comunidade/[id]', params: { id: c.id } })}>
          <Cartao>
            <Texto v="tituloM">{c.nome}</Texto>
            <Texto v="legenda">{c.exemplos.join(' · ')}</Texto>
          </Cartao>
        </Pressable>
      ))}
    </Tela>
  );
}
