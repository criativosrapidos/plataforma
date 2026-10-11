import { RefreshControl, View } from 'react-native';

import { Avatar, Botao, Cartao, Tela, Texto } from '@/componentes/ui';
import { exigir, useDados } from '@/lib/dados';
import { reais } from '@/lib/formato';
import { useEu, useSessao } from '@/lib/sessao';
import { supabase } from '@/lib/supabase';
import { espaco, useCores } from '@/tema';

export default function Perfil() {
  const eu = useEu();
  const { sessao } = useSessao();
  const c = useCores();
  const { dados, recarregar } = useDados(async () => {
    const [perfil, numeros, ativas] = await Promise.all([
      exigir(supabase.from('perfis').select('nome').eq('id', eu).single()),
      exigir(supabase.rpc('numeros_do_perfil', { pessoa: eu }).single()),
      supabase.from('metas').select('id', { count: 'exact', head: true }).eq('user_id', eu).eq('status', 'ativa'),
    ]);
    return {
      nome: (perfil as { nome: string }).nome,
      numeros: numeros as { sequencia: number; cumpridas_pct: number; doados_centavos: number },
      ativas: ativas.count ?? 0,
    };
  }, eu);

  // Três números, sempre na mesma ordem: sequência, metas cumpridas, já doados.
  const numeros: [string, string][] = dados
    ? [
        [`${dados.numeros.sequencia} ${dados.numeros.sequencia === 1 ? 'dia' : 'dias'}`, 'sequência'],
        [`${dados.numeros.cumpridas_pct}%`, 'cumpridas'],
        [reais(dados.numeros.doados_centavos), 'já doados'],
      ]
    : [];

  return (
    <Tela topo refresh={<RefreshControl refreshing={false} onRefresh={recarregar} />}>
      <View style={{ alignItems: 'center', gap: espaco[3], marginTop: espaco[6] }}>
        <Avatar nome={dados?.nome ?? '?'} tamanho={88} />
        <Texto v="tituloL">{dados?.nome ?? ''}</Texto>
        <Texto v="legenda">
          {dados ? `${dados.ativas} ${dados.ativas === 1 ? 'meta ativa' : 'metas ativas'}` : ''} · {sessao?.user.email}
        </Texto>
      </View>
      <Cartao style={{ flexDirection: 'row', padding: 0, gap: 0 }}>
        {numeros.map(([valor, rotulo], i) => (
          <View key={rotulo} style={{ flex: 1, padding: espaco[4], gap: 2, borderLeftWidth: i ? 1 : 0, borderLeftColor: c.linha }}>
            <Texto v="valor" style={{ fontSize: 20, lineHeight: 26 }}>{valor}</Texto>
            <Texto v="legenda">{rotulo}</Texto>
          </View>
        ))}
      </Cartao>
      <Texto v="legenda">“Já doados” é contribuição, não vergonha: é o que suas multas viraram para a instituição que você escolheu.</Texto>
      <Botao tipo="secundario" titulo="Sair" onPress={() => supabase.auth.signOut()} />
    </Tela>
  );
}
