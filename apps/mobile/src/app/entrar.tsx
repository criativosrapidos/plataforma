import { useRef, useState } from "react";
import { StyleSheet, View, type TextInputInstance } from "react-native";
import { router } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { ErroApi, mensagemDeErro } from "@/api/cliente";
import { Botao } from "@/componentes/Botao";
import { Campo } from "@/componentes/Campo";
import { BarraVoltar } from "@/componentes/Cabecalho";
import { TituloGrifado } from "@/componentes/Grifo";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useSessao } from "@/contexto/Sessao";
import { SITE_URL } from "@/lib/config";
import { abrirLink } from "@/lib/links";
import { vibrar } from "@/lib/vibrar";
import { cores } from "@/tema";

export default function Entrar() {
  const { entrar } = useSessao();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const refSenha = useRef<TextInputInstance>(null);

  async function enviar() {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Confira o e-mail";
    if (!senha) e.senha = "Informe a senha";
    setErros(e);
    setErroGeral(null);
    if (Object.keys(e).length) return vibrar.erro();
    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
      vibrar.sucesso();
    } catch (err) {
      vibrar.erro();
      if (err instanceof ErroApi && err.campos) setErros(err.campos);
      setErroGeral(mensagemDeErro(err));
      setEnviando(false);
    }
  }

  return (
    <Tela
      topo={
        <View style={{ paddingHorizontal: 16 }}>
          <BarraVoltar aoVoltar={() => (router.canGoBack() ? router.back() : router.replace("/boas-vindas"))} />
        </View>
      }
    >
      <View style={s.cabeca}>
        <TituloGrifado texto="Entrar" />
        <Texto variante="corpo" cor={cores.tx2}>
          Seus concursos, prazos e avisos continuam aqui.
        </Texto>
      </View>
      <Campo
        rotulo="E-mail"
        icone={Mail}
        value={email}
        onChangeText={setEmail}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => refSenha.current?.focus()}
        erro={erros.email}
        testID="campo-email"
      />
      <Campo
        ref={refSenha}
        rotulo="Senha"
        icone={Lock}
        senha
        value={senha}
        onChangeText={setSenha}
        placeholder="Sua senha"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={enviar}
        erro={erros.senha}
        testID="campo-senha"
      />
      {erroGeral ? (
        <View style={s.erro} accessibilityLiveRegion="polite">
          <Texto variante="corpoForte" cor={cores.vermTexto} style={{ fontSize: 14 }}>
            {erroGeral}
          </Texto>
        </View>
      ) : null}
      <Botao titulo="Entrar" tamanho="g" bloco carregando={enviando} onPress={enviar} testID="botao-entrar" />
      <Pressionavel onPress={() => void abrirLink(`${SITE_URL}/recuperar-senha`)} style={s.link} accessibilityRole="link">
        <Texto variante="corpoForte" cor={cores.azul} centro>
          Esqueci a senha
        </Texto>
      </Pressionavel>
      <View style={s.rodape}>
        <Texto variante="meta">Ainda não tem conta?</Texto>
        <Pressionavel onPress={() => router.replace("/cadastro")} style={s.link} accessibilityRole="link">
          <Texto variante="corpoForte" cor={cores.azul}>
            Criar conta e testar 3 dias
          </Texto>
        </Pressionavel>
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  cabeca: { gap: 8, marginTop: 8, marginBottom: 6 },
  erro: { backgroundColor: cores.vermT, borderRadius: 14, padding: 12 },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "center" },
  rodape: { alignItems: "center", marginTop: 8 },
});
