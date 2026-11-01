import { useRef, useState } from "react";
import { StyleSheet, View, type TextInputInstance } from "react-native";
import { router } from "expo-router";
import { Lock, Mail, User } from "lucide-react-native";
import { ErroApi, mensagemDeErro } from "@/api/cliente";
import { Botao } from "@/componentes/Botao";
import { Campo } from "@/componentes/Campo";
import { BarraVoltar } from "@/componentes/Cabecalho";
import { CaixaMarcar } from "@/componentes/Controles";
import { TituloGrifado } from "@/componentes/Grifo";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Tela } from "@/componentes/Tela";
import { Texto } from "@/componentes/Texto";
import { useSessao } from "@/contexto/Sessao";
import { LINKS } from "@/lib/config";
import { abrirLink } from "@/lib/links";
import { vibrar } from "@/lib/vibrar";
import { cores } from "@/tema";

export default function Cadastro() {
  const { cadastrar } = useSessao();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceito, setAceito] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const refEmail = useRef<TextInputInstance>(null);
  const refSenha = useRef<TextInputInstance>(null);

  async function enviar() {
    const e: Record<string, string> = {};
    if (nome.trim().length < 2) e.nome = "Informe seu nome";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Confira o e-mail";
    if (senha.length < 8) e.senha = "Mínimo de 8 caracteres";
    if (!aceito) e.aceito_termos = "Aceite os termos para continuar";
    setErros(e);
    setErroGeral(null);
    if (Object.keys(e).length) return vibrar.erro();
    setEnviando(true);
    try {
      await cadastrar({ nome: nome.trim(), email: email.trim(), senha });
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
        <TituloGrifado texto="Criar [conta]" />
        <Texto variante="corpo" cor={cores.tx2}>
          Leva um minuto. Depois você diz o que procura e testa 3 dias grátis.
        </Texto>
      </View>
      <Campo
        rotulo="Seu nome"
        icone={User}
        value={nome}
        onChangeText={setNome}
        placeholder="Como quer ser chamado"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => refEmail.current?.focus()}
        erro={erros.nome}
        testID="campo-nome"
      />
      <Campo
        ref={refEmail}
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
        placeholder="Mínimo de 8 caracteres"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        erro={erros.senha}
        dica="Use pelo menos 8 caracteres."
        testID="campo-senha"
      />
      <Pressionavel
        onPress={() => setAceito((v) => !v)}
        haptico="selecao"
        escala={0.99}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: aceito }}
        accessibilityLabel="Li e aceito os termos de uso e a política de privacidade"
        style={s.termos}
        testID="aceito-termos"
      >
        <CaixaMarcar marcado={aceito} cor={cores.azul} />
        <Texto variante="meta" style={{ flex: 1, color: cores.tinta }}>
          Li e aceito os termos de uso e a política de privacidade.
        </Texto>
      </Pressionavel>
      <View style={s.links}>
        <Pressionavel onPress={() => void abrirLink(LINKS.termos)} accessibilityRole="link" style={s.linkPequeno}>
          <Texto variante="pequeno" cor={cores.azul} style={s.sublinhado}>
            Ler os termos
          </Texto>
        </Pressionavel>
        <Pressionavel onPress={() => void abrirLink(LINKS.privacidade)} accessibilityRole="link" style={s.linkPequeno}>
          <Texto variante="pequeno" cor={cores.azul} style={s.sublinhado}>
            Ler a política de privacidade
          </Texto>
        </Pressionavel>
      </View>
      {erros.aceito_termos ? (
        <Texto variante="pequeno" cor={cores.vermTexto}>
          {erros.aceito_termos}
        </Texto>
      ) : null}
      {erroGeral ? (
        <View style={s.erro} accessibilityLiveRegion="polite">
          <Texto variante="corpoForte" cor={cores.vermTexto} style={{ fontSize: 14 }}>
            {erroGeral}
          </Texto>
        </View>
      ) : null}
      <Botao titulo="Criar conta" tamanho="g" bloco carregando={enviando} onPress={enviar} testID="botao-criar-conta" />
      <View style={s.rodape}>
        <Texto variante="meta">Já tem conta?</Texto>
        <Pressionavel onPress={() => router.replace("/entrar")} style={s.link} accessibilityRole="link">
          <Texto variante="corpoForte" cor={cores.azul}>
            Entrar
          </Texto>
        </Pressionavel>
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  cabeca: { gap: 8, marginTop: 8, marginBottom: 6 },
  termos: { flexDirection: "row", gap: 12, alignItems: "center", minHeight: 44 },
  sublinhado: { textDecorationLine: "underline" },
  links: { flexDirection: "row", gap: 16, marginTop: -10, paddingLeft: 36 },
  linkPequeno: { minHeight: 36, justifyContent: "center" },
  erro: { backgroundColor: cores.vermT, borderRadius: 14, padding: 12 },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "center" },
  rodape: { alignItems: "center", marginTop: 4 },
});
