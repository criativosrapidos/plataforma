import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { CartaoMeta } from '@/componentes/cartao-meta';
import { ListaDoFeed, useFeed } from '@/componentes/feed';
import { Aviso, Botao, Chip, Logo, Secao, Tela, Texto } from '@/componentes/ui';
import { useCatalogo } from '@/lib/catalogo';
import { exigir, useDados } from '@/lib/dados';
import { reais } from '@/lib/formato';
import { useEu } from '@/lib/sessao';
import { supabase } from '@/lib/supabase';
import type { Checkin, Meta, Multa } from '@/lib/tipos';
import { espaco } from '@/tema';

export default function Inicio() {
  const eu = useEu();
  const { comunidades, nomeDaComunidade } = useCatalogo();
  const [filtro, setFiltro] = useState<string | undefined>();
  const feed = useFeed(filtro);

  const minhas = useDados(async () => {
    const metas = (await exigir(supabase.from('metas').select('*').eq('user_id', eu).eq('status', 'ativa').order('criado_em'))) as Meta[];
    const ids = metas.map((m) => m.id);
    const [checkins, multas, pendentes, fiscais] = await Promise.all([
      ids.length ? exigir(supabase.from('checkins').select('*').in('meta_id', ids)) : Promise.resolve([]),
      exigir(supabase.from('multas').select('*').eq('status', 'aberta')),
      exigir(supabase.from('checkins').select('id, metas!inner(fiscal_id)').eq('status', 'pendente').eq('metas.fiscal_id', eu)),
      exigir(supabase.from('perfis').select('id, nome').in('id', metas.map((m) => m.fiscal_id).filter((x): x is string => !!x))),
    ]);
    return {
      metas,
      checkins: checkins as Checkin[],
      multas: multas as Multa[],
      pendentes: (pendentes as unknown[]).length,
      fiscais: Object.fromEntries((fiscais as { id: string; nome: string }[]).map((p) => [p.id, p.nome])),
    };
  }, eu);

  const recarregar = () => {
    minhas.recarregar();
    feed.recarregar();
  };
  const d = minhas.dados;

  return (
    <Tela topo refresh={<RefreshControl refreshing={false} onRefresh={recarregar} />}>
      <Logo />

      {d?.multas.length ? (
        <Aviso
          titulo={`Você tem ${d.multas.length === 1 ? 'uma multa' : `${d.multas.length} multas`} em aberto`}
          texto={`Não foi dessa vez. ${reais(d.multas.reduce((s, m) => s + m.valor_centavos, 0))} vão para a instituição que você escolheu.`}
          acao={<Botao pequeno titulo="Ver multa" onPress={() => router.push({ pathname: '/multa/[id]', params: { id: d.multas[0].id } })} />}
        />
      ) : null}

      {d?.pendentes ? (
        <Aviso
          titulo={`${d.pendentes} check-in${d.pendentes > 1 ? 's' : ''} para você conferir`}
          texto="Seus amigos contam com você. Se não responder em 24 horas, o check-in vale."
          acao={<Botao pequeno titulo="Conferir" onPress={() => router.push('/metas')} />}
        />
      ) : null}

      <Secao titulo="Sua meta de hoje">
        {d && d.metas.length === 0 ? (
          <Aviso
            titulo="Nenhuma meta ativa"
            texto="Crie uma meta, coloque um valor e chame um amigo para fiscalizar."
            acao={<Botao tipo="aposta" titulo="Criar meta" onPress={() => router.push('/meta/nova')} />}
          />
        ) : null}
        {d?.metas.map((m) => (
          <CartaoMeta
            key={m.id}
            meta={m}
            checkins={d.checkins.filter((c) => c.meta_id === m.id)}
            comunidade={nomeDaComunidade(m.comunidade_id)}
            fiscal={m.fiscal_id ? d.fiscais[m.fiscal_id] : undefined}
          />
        ))}
        {minhas.erro ? <Texto cor="perda">{minhas.erro}</Texto> : null}
      </Secao>

      <Secao titulo="Na comunidade">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco[2] }}>
          <Chip rotulo="Todas" ativo={!filtro} onPress={() => setFiltro(undefined)} />
          {comunidades?.map((c) => <Chip key={c.id} rotulo={c.nome} ativo={filtro === c.id} onPress={() => setFiltro(c.id)} />)}
        </ScrollView>
        <View>
          <ListaDoFeed {...feed} />
        </View>
      </Secao>
    </Tela>
  );
}
