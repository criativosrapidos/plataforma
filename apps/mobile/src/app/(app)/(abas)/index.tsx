// Hoje: contagem regressiva da próxima prova, prazos da semana, avisos e novidades do perfil.
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Bell, CalendarCheck, Compass, Inbox, SlidersHorizontal } from "lucide-react-native";
import { dataBR, somarDias, type AcompanhandoItemDTO, type HojeResponse } from "@aviso/shared";
import { useAcompanhando, useHoje, useMe } from "@/api/consultas";
import { mensagemDeErro } from "@/api/cliente";
import { BotaoRedondo, Cabecalho, Secao } from "@/componentes/Cabecalho";
import { CartaoAviso } from "@/componentes/CartaoAviso";
import { CartaoConcurso } from "@/componentes/CartaoConcurso";
import { useNumeroAnimado } from "@/componentes/Contagem";
import { Esqueleto, EsqueletoLista } from "@/componentes/Esqueleto";
import { EstadoErro, EstadoVazio } from "@/componentes/EstadoVazio";
import { LinhaCompromisso } from "@/componentes/LinhaCompromisso";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useSessao } from "@/contexto/Sessao";
import { dataChave, diasAte, hojeLocal, primeiroNome, saudacao } from "@/lib/formato";
import { cores, fontes, raio, sombra } from "@/tema";

export default function Hoje() {
  const { me } = useSessao();
  const meQ = useMe();
  const hoje = useHoje();
  const acomp = useAcompanhando();
  const dia = hojeLocal();
  const naoLidos = me?.contagens.avisosNaoLidos ?? 0;

  const prazos = useMemo(() => {
    const ate = somarDias(dia, 7);
    return (hoje.data?.prazos ?? []).filter((c) => {
      const k = dataChave(c);
      return !!k && k >= dia && k <= ate;
    });
  }, [hoje.data, dia]);

  const atualizar = () => Promise.all([hoje.refetch(), acomp.refetch(), meQ.refetch()]);
  const teste = me?.acesso.emTeste ? me.acesso.diasRestantesTeste : null;

  return (
    <Tela areaSeguraBaixo={false} aoAtualizar={atualizar} testID="tela-hoje">
      <Cabecalho
        sobre={`${saudacao()}, ${primeiroNome(me?.usuario.nome)}`}
        titulo="Hoje"
        direita={
          <BotaoRedondo
            rotulo={naoLidos ? `Avisos: ${naoLidos} ${naoLidos === 1 ? "novo" : "novos"}` : "Avisos"}
            onPress={() => router.push("/avisos")}
            testID="sino"
          >
            <Bell size={22} color={cores.tinta} strokeWidth={2.2} />
            {naoLidos > 0 ? (
              <View style={s.badge}>
                <Texto style={s.badgeTexto} maxFontSizeMultiplier={1}>
                  {naoLidos > 9 ? "9+" : naoLidos}
                </Texto>
              </View>
            ) : null}
          </BotaoRedondo>
        }
      />

      {teste !== null && teste <= 1 ? (
        <Pressionavel onPress={() => router.navigate("/ajustes")} style={s.teste} accessibilityLabel="Ver plano e assinatura">
          <Texto variante="corpoForte" style={{ fontSize: 14 }}>
            {teste === 0 ? "Seu teste grátis acaba hoje." : "Seu teste grátis acaba amanhã."}
          </Texto>
          <Texto variante="meta" cor={cores.tinta}>
            A primeira cobrança é no 4º dia. Se não quiser continuar, cancele em Ajustes.
          </Texto>
        </Pressionavel>
      ) : null}

      {hoje.isPending ? (
        <Esqueleto altura={150} arredondado={raio.hero} />
      ) : hoje.isError ? (
        <EstadoErro mensagem={mensagemDeErro(hoje.error)} aoTentar={() => void hoje.refetch()} />
      ) : (
        <Hero proxima={hoje.data.proximaProva} />
      )}

      <Contagens itens={acomp.data} carregando={acomp.isPending} dia={dia} />

      <Secao titulo="Prazos da semana" acao="Ver agenda" aoAcao={() => router.navigate("/agenda")} />
      {hoje.isPending ? (
        <EsqueletoLista quantos={2} linhas={2} />
      ) : prazos.length ? (
        prazos.slice(0, 5).map((c, i) => (
          <Animated.View key={c.id} entering={FadeInDown.delay(40 * i).duration(260)}>
            <LinhaCompromisso c={c} hoje={dia} />
          </Animated.View>
        ))
      ) : (
        <EstadoVazio
          compacto
          icone={CalendarCheck}
          titulo="Nenhum prazo nos próximos 7 dias"
          texto="Quando algum prazo dos seus concursos chegar perto, ele aparece aqui."
        />
      )}

      <Secao
        titulo="Avisos recentes"
        acao={hoje.data?.avisos.length ? "Ver todos" : undefined}
        aoAcao={() => router.push("/avisos")}
        testID="ver-avisos"
      />
      {hoje.isPending ? (
        <EsqueletoLista quantos={2} />
      ) : hoje.data?.avisos.length ? (
        hoje.data.avisos.slice(0, 3).map((a, i) => (
          <Animated.View key={a.id} entering={FadeInDown.delay(40 * i).duration(260)}>
            <CartaoAviso aviso={a} />
          </Animated.View>
        ))
      ) : (
        <EstadoVazio
          compacto
          icone={Inbox}
          titulo="Nenhum aviso por enquanto"
          texto="Edital, prazo acabando e errata dos seus concursos chegam aqui e no celular."
        />
      )}

      <Secao titulo="Novos para o seu perfil" acao="Explorar" aoAcao={() => router.navigate("/concursos?aba=explorar")} />
      {hoje.isPending ? (
        <EsqueletoLista quantos={1} />
      ) : hoje.data?.novidades.length ? (
        hoje.data.novidades.map((c, i) => (
          <Animated.View key={c.id} entering={FadeInDown.delay(40 * i).duration(260)}>
            <CartaoConcurso c={c} motivo="Combina com seu perfil" />
          </Animated.View>
        ))
      ) : me?.contagens.perfis ? (
        <EstadoVazio
          compacto
          icone={Compass}
          titulo="Nada novo no seu perfil hoje"
          texto="A gente lê os diários oficiais todo dia. Enquanto isso, explore os concursos abertos."
          acao="Explorar concursos"
          aoAcao={() => router.navigate("/concursos?aba=explorar")}
        />
      ) : (
        <EstadoVazio
          compacto
          icone={SlidersHorizontal}
          titulo="Diz o que você procura"
          texto="Crie um perfil de busca para receber os concursos que combinam com você."
          acao="Criar perfil"
          aoAcao={() => router.push("/perfis/novo")}
        />
      )}
    </Tela>
  );
}

function Hero({ proxima }: { proxima: HojeResponse["proximaProva"] }) {
  const n = useNumeroAnimado(proxima?.dias ?? 0);
  if (!proxima) {
    return (
      <View style={[s.hero, sombra]}>
        <Texto variante="rotulo" cor={cores.azulSuave}>
          Próxima prova
        </Texto>
        <Texto variante="display" cor={cores.branco} style={{ fontSize: 38, lineHeight: 40 }}>
          Nenhuma prova{" "}
          <Texto variante="display" cor={cores.marca} style={{ fontSize: 38, lineHeight: 40 }}>
            marcada
          </Texto>
        </Texto>
        <Texto variante="corpo" cor={cores.azulTextoClaro} style={{ fontSize: 14 }}>
          Acompanhe um concurso com data de prova para ver a contagem aqui.
        </Texto>
        <Bolhas />
      </View>
    );
  }
  const frase = proxima.dias === 0 ? { a: "É", b: "hoje" } : proxima.dias === 1 ? { a: "É", b: "amanhã" } : { a: "Faltam", b: `${n} dias` };
  return (
    <Pressionavel
      onPress={() => router.push(`/concurso/${proxima.contest_id}`)}
      escala={0.98}
      style={[s.hero, sombra]}
      accessibilityLabel={`Próxima prova: ${proxima.concurso}, em ${dataBR(proxima.data)}. ${proxima.dias === 0 ? "É hoje" : proxima.dias === 1 ? "É amanhã" : `Faltam ${proxima.dias} dias`}.`}
      testID="hero-prova"
    >
      <Texto variante="rotulo" cor={cores.azulSuave}>
        Próxima prova
      </Texto>
      <Texto variante="display" cor={cores.branco}>
        {frase.a}{" "}
        <Texto variante="display" cor={cores.marca}>
          {frase.b}
        </Texto>
      </Texto>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={[s.corHero, { backgroundColor: proxima.cor === cores.azul ? cores.marca : proxima.cor }]} />
        <Texto variante="corpo" cor={cores.azulTextoClaro} style={{ fontSize: 14 }}>
          {proxima.concurso} · {dataBR(proxima.data)}
        </Texto>
      </View>
      <Bolhas />
    </Pressionavel>
  );
}

/** Bolinhas de gabarito decorativas (a "C" marcada). */
function Bolhas() {
  return (
    <View style={s.bolhas} pointerEvents="none" aria-hidden>
      {["A", "B", "C", "D", "E"].map((l) => (
        <View key={l} style={[s.bolha, l === "C" && { backgroundColor: cores.marca, borderColor: cores.marca }]}>
          <Texto maxFontSizeMultiplier={1} style={[s.bolhaTexto, l === "C" && { color: cores.tinta }]}>
            {l}
          </Texto>
        </View>
      ))}
    </View>
  );
}

function Contagens({ itens, carregando, dia }: { itens: AcompanhandoItemDTO[] | undefined; carregando: boolean; dia: string }) {
  if (carregando) {
    return (
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <Esqueleto key={i} largura="31%" altura={92} arredondado={18} style={{ flex: 1 }} />
        ))}
      </View>
    );
  }
  if (!itens?.length) return null;
  const cartoes = itens.map((a) => {
    const provas = a.datas.filter((d) => d.tipo === "prova" && (dataChave(d) ?? "") >= dia).map((d) => dataChave(d)!);
    const prova = provas.sort()[0];
    return { id: a.contest_id, sigla: a.concurso.orgao_sigla ?? a.concurso.orgao, cor: a.cor, dias: prova ? diasAte(prova, dia) : null };
  });
  const cabem = cartoes.length <= 3;
  const lista = cartoes.map((c, i) => (
    <Animated.View key={c.id} entering={FadeInDown.delay(50 * i).duration(280)} style={cabem ? { flex: 1 } : null}>
      <Pressionavel
        onPress={() => router.push(`/concurso/${c.id}`)}
        style={[s.mini, cabem ? { width: "100%" } : null, { borderTopColor: c.cor }]}
        accessibilityLabel={`${c.sigla}: ${c.dias == null ? "prova sem data" : c.dias === 0 ? "prova hoje" : `prova em ${c.dias} dias`}`}
      >
        <Texto variante="rotulo" cor={cores.tx2} numberOfLines={1} style={{ fontSize: 10 }}>
          {c.sigla}
        </Texto>
        <Texto style={s.miniNum} maxFontSizeMultiplier={1.2}>
          {c.dias == null ? "—" : c.dias}
        </Texto>
        <Texto variante="corpoForte" style={{ fontSize: 12 }}>
          {c.dias == null ? "sem data" : c.dias === 1 ? "dia" : "dias"}
        </Texto>
      </Pressionavel>
    </Animated.View>
  ));
  if (cabem) return <View style={{ flexDirection: "row", gap: 8 }}>{lista}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -16 }}>
      <View style={{ width: 8 }} />
      {lista}
      <View style={{ width: 8 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: cores.marca,
    borderWidth: 2,
    borderColor: cores.papel,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTexto: { fontFamily: fontes.monoNegrito, fontSize: 10, lineHeight: 12, color: cores.tinta },
  teste: { backgroundColor: cores.marcaT, borderRadius: 18, padding: 14, gap: 4, borderWidth: 1, borderColor: "#F3E39A" },
  hero: { backgroundColor: cores.azul, borderRadius: raio.hero, padding: 18, paddingBottom: 20, gap: 6, overflow: "hidden" },
  corHero: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: cores.branco },
  bolhas: { position: "absolute", right: 14, top: 14, flexDirection: "row", gap: 4, opacity: 0.9 },
  bolha: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  bolhaTexto: { fontFamily: fontes.monoNegrito, fontSize: 8.5, color: "rgba(255,255,255,0.75)" },
  mini: {
    width: 108,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.linha,
    borderTopWidth: 5,
    borderRadius: 18,
    padding: 11,
    gap: 1,
  },
  miniNum: { fontFamily: fontes.display, fontSize: 32, lineHeight: 34, color: cores.tinta },
});
