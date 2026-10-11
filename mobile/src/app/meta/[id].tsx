import { router, useLocalSearchParams } from 'expo-router';
import { RefreshControl, Share, View } from 'react-native';

import { CartaoMeta } from '@/componentes/cartao-meta';
import { Aviso, Botao, Cartao, Carregando, Selo, Tela, Texto } from '@/componentes/ui';
import { useCatalogo } from '@/lib/catalogo';
import { exigir, useDados } from '@/lib/dados';
import { reais } from '@/lib/formato';
import { fimDaMeta } from '@/lib/meta';
import { useEu } from '@/lib/sessao';
import { supabase } from '@/lib/supabase';
import type { Checkin, Meta } from '@/lib/tipos';
import { espaco, useCores } from '@/tema';

const data = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/');

export default function DetalheDaMeta() {
  const { id, nova } = useLocalSearchParams<{ id: string; nova?: string }>();
  const eu = useEu();
  const c = useCores();
  const { nomeDaComunidade, instituicoes } = useCatalogo();
  const { dados: d, recarregar } = useDados(async () => {
    const meta = (await exigir(supabase.from('metas').select('*').eq('id', id).single())) as Meta;
    const [checkins, pessoas] = await Promise.all([
      exigir(supabase.from('checkins').select('*').eq('meta_id', id).order('dia', { ascending: false })),
      exigir(supabase.from('perfis').select('id, nome').in('id', [meta.user_id, meta.fiscal_id].filter((x): x is string => !!x))),
    ]);
    const nomes = Object.fromEntries((pessoas as { id: string; nome: string }[]).map((p) => [p.id, p.nome]));
    return { meta, checkins: checkins as Checkin[], nomes };
  }, id);

  if (!d) return <Carregando />;
  const { meta, checkins, nomes } = d;
  const minha = meta.user_id === eu;
  const instituicao = instituicoes?.find((i) => i.id === meta.instituicao_id)?.nome;

  function convidar() {
    Share.share({
      message: `Quero que você seja o fiscal da minha meta "${meta.titulo}" no FocoMulta. Tem ${reais(meta.valor_centavos)} em jogo por semana. No app, vá em Metas > Tenho um código e use: ${meta.codigo_convite}`,
    });
  }

  return (
    <Tela refresh={<RefreshControl refreshing={false} onRefresh={recarregar} />}>
      {!minha ? <Texto v="legenda">Meta de {nomes[meta.user_id]}{meta.fiscal_id === eu ? ' · você é o fiscal' : ''}</Texto> : null}
      <CartaoMeta
        meta={meta}
        checkins={checkins}
        comunidade={nomeDaComunidade(meta.comunidade_id)}
        fiscal={meta.fiscal_id ? nomes[meta.fiscal_id] : undefined}
        comBotao={minha}
      />

      {minha && meta.modo === 'com_fiscal' && !meta.fiscal_id && meta.status === 'ativa' ? (
        <Cartao style={nova ? { borderColor: c.foco, borderWidth: 2 } : undefined}>
          <Texto v="tituloS">{nova ? 'Meta criada. Agora chame seu fiscal.' : 'Sua meta ainda não tem fiscal'}</Texto>
          <Texto cor="tintaSuave">Mande este código para um amigo. Ele confirma seus check-ins em até 24 horas e não coloca dinheiro.</Texto>
          <Texto v="valorL" style={{ letterSpacing: 4 }}>{meta.codigo_convite}</Texto>
          <Botao titulo="Convidar fiscal" onPress={convidar} />
          <Texto v="legenda">Enquanto não tiver fiscal, o check-in com foto vale sozinho.</Texto>
        </Cartao>
      ) : null}

      <Cartao>
        <Texto v="rotulo">Como funciona esta meta</Texto>
        <Texto>
          {meta.checkins_por_semana === 7 ? 'Um check-in por dia' : `${meta.checkins_por_semana} check-ins por semana`}, de {data(meta.inicio)} a {data(fimDaMeta(meta))}.
          Semana com menos que isso: {reais(meta.valor_centavos)} viram doação para {instituicao ?? 'a instituição escolhida'}.
        </Texto>
      </Cartao>

      <View style={{ gap: espaco[3] }}>
        <Texto v="tituloM">Check-ins</Texto>
        {!checkins.length ? <Aviso titulo="Nenhum check-in ainda" texto="Cada check-in é uma foto tirada na hora." /> : null}
        {checkins.map((k) => (
          <View key={k.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: espaco[2], borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: c.linha }}>
            <Texto v="valor">{data(k.dia)}</Texto>
            <Selo
              estado={k.status === 'recusado' ? 'multada' : k.status === 'pendente' ? 'aguardando' : 'em-dia'}
              texto={k.status === 'recusado' ? 'Não valeu' : k.status === 'aprovado' ? 'Confirmado' : undefined}
            />
          </View>
        ))}
      </View>
      {minha ? null : <Botao tipo="secundario" titulo="Voltar" onPress={() => router.back()} />}
    </Tela>
  );
}
