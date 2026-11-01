"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { api, useEnvio } from "@/components/ui/api-cliente";
import { Campo, CampoSenha, Marcar } from "@/components/ui/Campo";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";
import { Icone } from "@/components/ui/Icone";

const emailValido = (e: string) => /^\S+@\S+\.\S+$/.test(e.trim());

export function TituloAuth({ rotulo, titulo, texto }: { rotulo: string; titulo: ReactNode; texto?: ReactNode }) {
  return (
    <div>
      <p className="rotulo text-azul">{rotulo}</p>
      <h1 className="mt-3 text-[clamp(2.6rem,9vw,3.6rem)]">{titulo}</h1>
      {texto ? <p className="mt-3 text-[17px] leading-relaxed text-tx2">{texto}</p> : null}
    </div>
  );
}

function comVoltar(caminho: string, voltar?: string) {
  if (!voltar || voltar === "/conta") return caminho;
  return `${caminho}${caminho.includes("?") ? "&" : "?"}voltar=${encodeURIComponent(voltar)}`;
}

export function FormEntrar({ voltar, aviso, emailInicial }: { voltar: string; aviso?: ReactNode; emailInicial?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(emailInicial ?? "");
  const [senha, setSenha] = useState("");
  const { enviando, erro, campos, enviar, validar } = useEnvio();
  const [indo, setIndo] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (validar({ email: !emailValido(email) && "Informe um e-mail válido", senha: !senha && "Informe a senha" })) return;
    const r = await enviar(() => api("/api/v1/auth/login", { corpo: { email: email.trim(), senha, cliente: "web" } }));
    if (r) {
      setIndo(true);
      router.replace(voltar);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-8">
      <TituloAuth rotulo="Sua conta" titulo={<>Entrar</>} texto="Use o mesmo e-mail e senha do app." />
      {aviso}
      <form onSubmit={aoEnviar} noValidate className="grid gap-5">
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={campos.email}
          autoFocus
        />
        <div>
          <CampoSenha
            rotulo="Senha"
            name="senha"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            erro={campos.senha}
          />
          <Link
            href={`/recuperar-senha${email ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
            className="mt-1 inline-flex min-h-11 items-center text-[15px] font-bold text-azul"
          >
            Esqueci a senha
          </Link>
        </div>
        {erro && !Object.keys(campos).length ? <Aviso tom="erro">{erro}</Aviso> : null}
        <Botao type="submit" tamanho="lg" larguraTotal carregando={enviando || indo}>
          {enviando || indo ? "Entrando..." : "Entrar"}
        </Botao>
      </form>
      <p className="border-t border-linha pt-6 text-[15px] text-tx2">
        Ainda não tem conta?{" "}
        <Link href={comVoltar("/cadastro", voltar)} className="font-bold text-azul">
          Teste 3 dias grátis
        </Link>
      </p>
    </div>
  );
}

export function FormCadastro({ destino, voltar }: { destino: string; voltar: string }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceito, setAceito] = useState(false);
  const [indo, setIndo] = useState(false);
  const { enviando, erro, campos, enviar, validar } = useEnvio();

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (
      validar({
        nome: nome.trim().length < 2 && "Informe seu nome",
        email: !emailValido(email) && "Informe um e-mail válido",
        senha: senha.length < 8 && "Mínimo de 8 caracteres",
        aceito_termos: !aceito && "Aceite os termos para continuar",
      })
    )
      return;
    const r = await enviar(() =>
      api("/api/v1/auth/cadastro", { corpo: { nome: nome.trim(), email: email.trim(), senha, aceito_termos: true, cliente: "web" } }),
    );
    if (r) {
      setIndo(true);
      router.replace(destino);
      router.refresh();
    }
  }

  const forca = senha.length === 0 ? null : senha.length < 8 ? "curta" : senha.length < 12 ? "boa" : "forte";

  return (
    <div className="grid gap-8">
      <TituloAuth
        rotulo="3 dias grátis"
        titulo={
          <>
            Crie sua <span className="grifo">conta</span>
          </>
        }
        texto="Leva 1 minuto. Depois você escolhe o plano e começa o teste."
      />
      <form onSubmit={aoEnviar} noValidate className="grid gap-5">
        <Campo rotulo="Nome" name="nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} erro={campos.nome} maxLength={120} />
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={campos.email}
        />
        <div>
          <CampoSenha
            rotulo="Senha"
            name="senha"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            erro={campos.senha}
            dica="Mínimo de 8 caracteres."
          />
          {forca && !campos.senha ? (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <span className="flex flex-1 gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={
                      "h-1.5 flex-1 rounded-full " +
                      (i < (forca === "curta" ? 1 : forca === "boa" ? 2 : 3)
                        ? forca === "curta"
                          ? "bg-verm"
                          : forca === "boa"
                            ? "bg-azul"
                            : "bg-verde"
                        : "bg-linha")
                    }
                  />
                ))}
              </span>
              <span className="font-mono text-[12px] font-bold text-tx2">senha {forca}</span>
            </div>
          ) : null}
        </div>
        <Marcar checked={aceito} onChange={(e) => setAceito(e.target.checked)} erro={campos.aceito_termos}>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="font-bold text-azul">
            termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="font-bold text-azul">
            política de privacidade
          </Link>
          .
        </Marcar>
        {erro && !Object.keys(campos).length ? <Aviso tom="erro">{erro}</Aviso> : null}
        {campos.email && erro?.includes("Já existe") ? (
          <Aviso tom="info">
            Esse e-mail já tem conta.{" "}
            <Link href={comVoltar(`/entrar?email=${encodeURIComponent(email.trim())}`, voltar)} className="font-bold text-azul">
              Entrar
            </Link>
          </Aviso>
        ) : null}
        <Botao type="submit" tamanho="lg" larguraTotal carregando={enviando || indo} iconeDepois="setaDireita">
          {enviando || indo ? "Criando..." : "Criar conta"}
        </Botao>
        <p className="flex items-start gap-2 text-[13px] leading-relaxed text-tx2">
          <Icone nome="cadeado" tamanho={15} className="mt-0.5 shrink-0" />
          Você só cadastra o pagamento no próximo passo. Nada é cobrado durante os 3 dias de teste.
        </p>
      </form>
      <p className="border-t border-linha pt-6 text-[15px] text-tx2">
        Já tem conta?{" "}
        <Link href={comVoltar("/entrar", voltar)} className="font-bold text-azul">
          Entrar
        </Link>
      </p>
    </div>
  );
}

export function FormRecuperar({ emailInicial }: { emailInicial?: string }) {
  const [email, setEmail] = useState(emailInicial ?? "");
  const [enviado, setEnviado] = useState<string | null>(null);
  const { enviando, erro, campos, enviar, validar } = useEnvio();

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (validar({ email: !emailValido(email) && "Informe um e-mail válido" })) return;
    const r = await enviar(() => api<{ mensagem: string }>("/api/v1/auth/recuperar", { corpo: { email: email.trim() } }));
    if (r) setEnviado(r.mensagem);
  }

  if (enviado) {
    return (
      <div className="grid gap-6" role="status">
        <span className="grid size-16 place-items-center rounded-full bg-azul-t text-azul">
          <Icone nome="email" tamanho={30} />
        </span>
        <TituloAuth rotulo="Confira seu e-mail" titulo="Link enviado" texto={enviado} />
        <p className="text-[15px] text-tx2">
          Não chegou? Olhe a caixa de spam ou{" "}
          <button type="button" onClick={() => setEnviado(null)} className="min-h-11 font-bold text-azul">
            tente de novo
          </button>
          .
        </p>
        <BotaoLink href="/entrar" variante="secundario" icone="setaEsquerda">
          Voltar para entrar
        </BotaoLink>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <TituloAuth rotulo="Sua conta" titulo="Esqueci a senha" texto="Informe o e-mail da sua conta. A gente manda um link para você criar uma nova senha." />
      <form onSubmit={aoEnviar} noValidate className="grid gap-5">
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={campos.email}
          autoFocus
        />
        {erro && !Object.keys(campos).length ? <Aviso tom="erro">{erro}</Aviso> : null}
        <Botao type="submit" tamanho="lg" larguraTotal carregando={enviando}>
          {enviando ? "Enviando..." : "Enviar link"}
        </Botao>
      </form>
      <p className="border-t border-linha pt-6 text-[15px] text-tx2">
        Lembrou?{" "}
        <Link href="/entrar" className="font-bold text-azul">
          Entrar
        </Link>
      </p>
    </div>
  );
}

export function FormRedefinir({ token }: { token: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [indo, setIndo] = useState(false);
  const { enviando, erro, campos, enviar, validar } = useEnvio();

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (
      validar({
        senha: senha.length < 8 && "Mínimo de 8 caracteres",
        confirma: senha !== confirma && "As senhas não são iguais",
      })
    )
      return;
    const r = await enviar(() => api("/api/v1/auth/redefinir", { corpo: { token, senha, cliente: "web" } }));
    if (r) {
      setIndo(true);
      router.replace("/conta?senha=redefinida");
      router.refresh();
    }
  }

  return (
    <div className="grid gap-8">
      <TituloAuth
        rotulo="Sua conta"
        titulo={
          <>
            Nova <span className="grifo">senha</span>
          </>
        }
        texto="Ao salvar, você entra na conta e as outras sessões abertas são encerradas."
      />
      <form onSubmit={aoEnviar} noValidate className="grid gap-5">
        <CampoSenha
          rotulo="Nova senha"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={campos.senha}
          dica="Mínimo de 8 caracteres."
          autoFocus
        />
        <CampoSenha
          rotulo="Repita a nova senha"
          autoComplete="new-password"
          value={confirma}
          onChange={(e) => setConfirma(e.target.value)}
          erro={campos.confirma}
        />
        {erro && !Object.keys(campos).length ? (
          <Aviso tom="erro" acao={<BotaoLink href="/recuperar-senha" variante="secundario" tamanho="sm">Pedir novo link</BotaoLink>}>
            {erro}
          </Aviso>
        ) : null}
        <Botao type="submit" tamanho="lg" larguraTotal carregando={enviando || indo}>
          {enviando || indo ? "Salvando..." : "Salvar e entrar"}
        </Botao>
      </form>
    </div>
  );
}
