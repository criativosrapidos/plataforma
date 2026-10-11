import { useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { Aviso, Botao, Campo, Simbolo, Tela, Texto } from '@/componentes/ui';
import { configurado, mensagemDeErro, supabase } from '@/lib/supabase';
import { espaco } from '@/tema';

export default function Entrar() {
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setMensagem(null);
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) throw error;
      } else {
        if (nome.trim().length < 2) throw new Error('Diga como você quer ser chamado.');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome: nome.trim() } },
        });
        if (error) throw error;
        if (!data.session) setMensagem('Enviamos um link de confirmação para o seu e-mail. Confirme e volte para entrar.');
      }
    } catch (e) {
      setMensagem(traduzir(mensagemDeErro(e)));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Tela topo>
        <View style={{ gap: espaco[4], marginTop: espaco[12] }}>
          <Simbolo tamanho={72} />
          <Texto v="tituloXl">Sua meta vale quanto?</Texto>
          <Texto cor="tintaSuave">Prometa, coloque um valor e chame um amigo para fiscalizar. Se falhar, a multa vira doação.</Texto>
          <Botao tipo="secundario" titulo="Ver como funciona (2 min)" onPress={() => router.push('/como-funciona')} style={{ alignSelf: 'flex-start' }} />
        </View>

        {!configurado ? (
          <Aviso
            titulo="Falta conectar o Supabase"
            texto="Crie o arquivo mobile/.env com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY (veja o README)."
          />
        ) : null}

        <View style={{ gap: espaco[4] }}>
          {modo === 'criar' ? (
            <Campo rotulo="Como quer ser chamado" value={nome} onChangeText={setNome} autoComplete="name" placeholder="Seu nome" />
          ) : null}
          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="voce@email.com"
          />
          <Campo
            rotulo="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
            placeholder={modo === 'criar' ? 'Pelo menos 8 caracteres' : ''}
          />
          {mensagem ? <Texto cor="tintaSuave">{mensagem}</Texto> : null}
          <Botao titulo={modo === 'entrar' ? 'Entrar' : 'Criar conta'} onPress={enviar} carregando={enviando} desativado={!configurado} />
          <Pressable onPress={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setMensagem(null); }} style={{ padding: espaco[2] }}>
            <Texto cor="foco" style={{ textAlign: 'center' }}>
              {modo === 'entrar' ? 'Ainda não tem conta? Criar conta' : 'Já tem conta? Entrar'}
            </Texto>
          </Pressable>
        </View>
      </Tela>
    </KeyboardAvoidingView>
  );
}

function traduzir(m: string): string {
  if (/invalid login credentials/i.test(m)) return 'E-mail ou senha não conferem.';
  if (/already registered/i.test(m)) return 'Esse e-mail já tem conta. Entre com ele.';
  if (/password should be at least/i.test(m)) return 'A senha precisa de pelo menos 8 caracteres.';
  if (/email not confirmed/i.test(m)) return 'Confirme o seu e-mail pelo link que enviamos.';
  return m;
}
