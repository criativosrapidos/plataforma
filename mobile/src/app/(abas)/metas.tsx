import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';

import { Bilhete } from '@/componentes/bilhete';
import { CartaoMeta } from '@/componentes/cartao-meta';
import { Aviso, Avatar, Botao, Cartao, Selo, Tela, Texto } from '@/componentes/ui';
import { useCatalogo } from '@/lib/catalogo';
import { exigir, urlsDasFotos, useDados } from '@/lib/dados';
import { haQuanto, reais } from '@/lib/formato';
import { useEu } from '@/lib/sessao';
import { mensagemDeErro, supabase } from '@/lib/supabase';
import type { Checkin, Meta, Multa } from '@/lib/tipos';
import { espaco, raio } from '@/tema';

type Pendente = Checkin & { metas: Pick<Meta, 'titulo' | 'comunidade_id'>; perfis: { nome: string } };

export default function Metas() {
  const eu = useEu();
  const { nomeDaComunidade } = useCatalogo();
  const [revisando, setRevisando] = useState<string | null>(null);

  const { dados: d, recarregar, erro } = useDados(async () => {
    const [metas, multas, pendentes] = await Promise.all([
      exigir(supabase.from('metas').select('*').eq('user_id', eu).order('criado_em', { ascending: false })),
      exigir(supabase.from('multas').select('*').order('criado_em', { ascending: false })),
      exigir(
        supabase
          .from('checkins')
          .select('*, metas!inner(titulo, comunidade_id, fiscal_id), perfis!checkins_user_id_fkey(nome)')
          .eq('status', 'pendente')
          .eq('metas.fiscal_id', eu)
          .order('criado_em'),
      ),
    ]);
    const ids = (metas as Meta[]).map((m) => m.id);
    const checkins = ids.length ? await exigir(supabase.from('checkins').select('*').in('meta_id', ids)) : [];
    const fotos = await urlsDasFotos((pendentes as Pendente[]).map((p) => p.foto_path));
    return { metas: metas as Meta[], multas: multas as Multa[], pendentes: pendentes as Pendente[], checkins: checkins as Checkin[], fotos };
  }, eu);

  async function revisar(id: string, aprovar: boolean) {
    setRevisando(id);
    const { error } = await supabase.rpc('revisar_checkin', { checkin: id, aprovar });
    setRevisando(null);
    if (error) Alert.alert('Não deu certo', mensagemDeErro(error));
    recarregar();
  }

  const ativas = d?.metas.filter((m) => m.status === 'ativa') ?? [];
  const encerradas = d?.metas.filter((m) => m.status !== 'ativa') ?? [];
  const tituloDaMeta = (id: string) => d?.metas.find((m) => m.id === id)?.titulo ?? '';

  return (
    <Tela topo refresh={<RefreshControl refreshing={false} onRefresh={recarregar} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto v="tituloL">Metas</Texto>
        <Botao pequeno tipo="aposta" titulo="Criar meta" onPress={() => router.push('/meta/nova')} />
      </View>
      {erro ? <Texto cor="perda">{erro}</Texto> : null}

      {d?.pendentes.length ? (
        <View style={{ gap: espaco[3] }}>
          <Texto v="tituloM">Para você fiscalizar</Texto>
          {d.pendentes.map((p) => (
            <Cartao key={p.id}>
              <View style={{ flexDirection: 'row', gap: espaco[3], alignItems: 'center' }}>
                <Avatar nome={p.perfis.nome} />
                <View style={{ flex: 1 }}>
                  <Texto v="corpoForte">{p.perfis.nome}</Texto>
                  <Texto v="legenda">{p.metas.titulo} · {haQuanto(p.criado_em)}</Texto>
                </View>
                <Selo estado="aguardando" />
              </View>
              {d.fotos[p.foto_path] ? (
                <Image source={{ uri: d.fotos[p.foto_path] }} contentFit="cover" style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: raio.sm }} />
              ) : null}
              {p.texto ? <Texto>{p.texto}</Texto> : null}
              <View style={{ flexDirection: 'row', gap: espaco[3] }}>
                <Botao style={{ flex: 1 }} tipo="secundario" titulo="Não vale" onPress={() => revisar(p.id, false)} desativado={revisando === p.id} />
                <Botao style={{ flex: 1 }} titulo="Confirmar" onPress={() => revisar(p.id, true)} carregando={revisando === p.id} />
              </View>
            </Cartao>
          ))}
        </View>
      ) : null}

      {d?.multas.filter((m) => m.status === 'aberta' || m.status === 'contestada').map((m) => (
        <Bilhete
          key={m.id}
          multada
          comunidade={m.status === 'contestada' ? 'Contestação em análise' : 'Multada'}
          titulo={tituloDaMeta(m.meta_id)}
          legenda={`Semana ${m.semana}: ${m.checkins_feitos} check-in${m.checkins_feitos === 1 ? '' : 's'}`}
          rodape={<Botao pequeno tipo="secundario" titulo="Ver multa" onPress={() => router.push({ pathname: '/multa/[id]', params: { id: m.id } })} style={{ alignSelf: 'flex-start' }} />}
          rotuloValor="Multa"
          valor={reais(m.valor_centavos)}
          legendaValor="vira doação"
        />
      ))}

      <View style={{ gap: espaco[6] }}>
        <Texto v="tituloM">Ativas</Texto>
        {d && !ativas.length ? <Aviso titulo="Nenhuma meta ativa" texto="Toda meta vira um bilhete. O canhoto mostra quanto vale a promessa." /> : null}
        {ativas.map((m) => (
          <CartaoMeta key={m.id} meta={m} checkins={d!.checkins.filter((c) => c.meta_id === m.id)} comunidade={nomeDaComunidade(m.comunidade_id)} />
        ))}
      </View>

      <Cartao>
        <Texto v="tituloS">Fiscalizar um amigo</Texto>
        <Texto cor="tintaSuave">Recebeu um código? Entre como fiscal e confirme os check-ins em até 24 horas. O fiscal não coloca dinheiro.</Texto>
        <Botao tipo="secundario" titulo="Tenho um código" onPress={() => router.push('/fiscalizar')} />
      </Cartao>

      {encerradas.length ? (
        <View style={{ gap: espaco[4] }}>
          <Texto v="tituloM">Encerradas</Texto>
          {encerradas.map((m) => {
            const doado = d!.multas.filter((x) => x.meta_id === m.id && x.status === 'paga').reduce((s, x) => s + x.valor_centavos, 0);
            return (
              <View key={m.id} style={{ gap: espaco[2] }}>
                <Bilhete
                  comunidade={nomeDaComunidade(m.comunidade_id)}
                  titulo={m.titulo}
                  rodape={<Selo estado={m.status === 'cumprida' ? 'cumprida' : 'multada'} />}
                  multada={m.status !== 'cumprida'}
                  rotuloValor={m.status === 'cumprida' ? 'Não perdeu' : 'Doado'}
                  valor={reais(m.status === 'cumprida' ? m.valor_centavos * m.semanas : doado)}
                  legendaValor={m.status === 'cumprida' ? 'no total' : 'para a instituição'}
                />
              </View>
            );
          })}
        </View>
      ) : null}
    </Tela>
  );
}
