import { router, Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, View } from 'react-native';

import { ListaDoFeed, useFeed } from '@/componentes/feed';
import { Botao, Chip, Tela, Texto } from '@/componentes/ui';
import { useCatalogo } from '@/lib/catalogo';
import { espaco } from '@/tema';

export default function Comunidade() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { comunidades } = useCatalogo();
  const comunidade = comunidades?.find((c) => c.id === id);
  const feed = useFeed(id);

  return (
    <Tela refresh={<RefreshControl refreshing={false} onRefresh={feed.recarregar} />}>
      <Stack.Screen options={{ title: comunidade?.nome ?? 'Comunidade' }} />
      <View style={{ gap: espaco[3] }}>
        <Texto v="tituloL">{comunidade?.nome}</Texto>
        <Texto v="rotulo">Gente se comprometendo a</Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[2] }}>
          {comunidade?.exemplos.map((e) => (
            <Chip key={e} rotulo={e} onPress={() => router.push({ pathname: '/meta/nova', params: { comunidade: id, titulo: e } })} />
          ))}
        </View>
        <Botao tipo="aposta" titulo="Criar meta aqui" onPress={() => router.push({ pathname: '/meta/nova', params: { comunidade: id } })} />
      </View>
      <ListaDoFeed {...feed} />
    </Tela>
  );
}
