import type { Metadata } from "next";
import Link from "next/link";
import { PLANO_INFO } from "@aviso/shared";
import { DocumentoLegal, Revisar, type SecaoLegal } from "@/components/site/DocumentoLegal";
import { EMAIL_PRIVACIDADE } from "@/components/site/conteudo";

export const metadata: Metadata = {
  title: "Privacidade e LGPD",
  description:
    "Quais dados o Aviso Concurso coleta, para que usa, com quem compartilha, por quanto tempo guarda e como você baixa ou apaga tudo. WhatsApp e busca do seu nome só com autorização.",
  alternates: { canonical: "/privacidade" },
};

const email = <a href={`mailto:${EMAIL_PRIVACIDADE}`}>{EMAIL_PRIVACIDADE}</a>;

const SECOES: SecaoLegal[] = [
  {
    id: "quem-somos",
    titulo: "Quem somos",
    conteudo: (
      <>
        <p>
          O Aviso Concurso é o controlador dos seus dados pessoais, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018,
          LGPD). Razão social e CNPJ: <Revisar>preencher razão social e CNPJ</Revisar>.
        </p>
        <p>
          <strong>Encarregado pelo tratamento de dados (DPO):</strong> <Revisar>nome do encarregado</Revisar>, pelo e-mail {email}.
          É por esse canal que você exerce os seus direitos e tira dúvidas sobre privacidade.
        </p>
      </>
    ),
  },
  {
    id: "dados-coletados",
    titulo: "Dados que coletamos",
    conteudo: (
      <>
        <p>Coletamos só o necessário para avisar você e organizar os seus concursos:</p>
        <ul>
          <li>
            <strong>Conta:</strong> nome, e-mail e senha. A senha é guardada só como resumo criptográfico (hash), nunca em texto.
          </li>
          <li>
            <strong>Perfis de busca:</strong> escolaridade, áreas, cargos, estados, salário mínimo, bancas e palavras-chave que você
            escolher.
          </li>
          <li>
            <strong>Uso do app:</strong> concursos que você acompanha, checklist, preferências de aviso (antecedência, horário
            silencioso) e o histórico de avisos enviados.
          </li>
          <li>
            <strong>Assinatura:</strong> plano, forma de pagamento escolhida, situação e histórico de cobranças. Os dados do cartão e
            do Pix automático ficam com o provedor de pagamento; nós não guardamos o número do cartão.
          </li>
          <li>
            <strong>Dispositivo e acesso:</strong> identificador de notificação do celular, tipo de aparelho, data e hora de acesso
            e o navegador usado em cada sessão.
          </li>
          <li>
            <strong>Telefone (WhatsApp):</strong> só se você informar e autorizar.
          </li>
          <li>
            <strong>Nome completo para busca em convocações:</strong> só se você autorizar expressamente.
          </li>
          <li>
            <strong>Pergunte ao edital:</strong> as perguntas que você faz e as respostas, para contar o limite do plano e melhorar o
            serviço.
          </li>
          <li>
            <strong>Contato antes do lançamento:</strong> nome, e-mail e WhatsApp deixados no formulário do site, com a página de
            origem.
          </li>
        </ul>
        <p>
          Não pedimos CPF, endereço nem dados sensíveis (como saúde, religião ou opinião política). Se você colocar algo assim em
          um campo livre, como palavra-chave, ele será tratado só para a busca.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    titulo: "Para que usamos e com qual base legal",
    conteudo: (
      <ul>
        <li>
          <strong>Prestar o serviço</strong> (casar seus perfis com os concursos, mandar avisos, montar a agenda e as matérias em
          comum): execução do contrato (art. 7º, V, da LGPD).
        </li>
        <li>
          <strong>Cobrança e nota fiscal:</strong> execução do contrato e cumprimento de obrigação legal (art. 7º, II e V).
        </li>
        <li>
          <strong>Avisos por WhatsApp:</strong> seu consentimento (art. 7º, I), que você pode retirar a qualquer momento.
        </li>
        <li>
          <strong>Busca do seu nome no Diário Oficial:</strong> seu consentimento específico e destacado (art. 7º, I, e art. 8º).
        </li>
        <li>
          <strong>Segurança, prevenção a fraude e registros de acesso:</strong> legítimo interesse (art. 7º, IX) e o Marco Civil
          da Internet (Lei nº 12.965/2014, art. 15).
        </li>
        <li>
          <strong>Aviso de lançamento do app</strong> para quem deixou o contato: consentimento.
        </li>
        <li>
          <strong>Estatísticas de uso agregadas</strong> para melhorar o produto: legítimo interesse, sem identificar você.
        </li>
      </ul>
    ),
  },
  {
    id: "whatsapp",
    titulo: "WhatsApp, só com o seu consentimento",
    conteudo: (
      <>
        <p>
          O aviso principal é a notificação do app. O WhatsApp é um extra do plano {PLANO_INFO.aprovado.nome} e só funciona se você
          informar o número e ligar a opção na sua conta. Mesmo assim, ele só é usado para dois tipos de mensagem: “isenção acaba
          amanhã” e “inscrição acaba amanhã”, com no máximo {PLANO_INFO.aprovado.limites.whatsappMes} mensagens por mês.
        </p>
        <p>
          Você desliga quando quiser, no app (Ajustes) ou em <Link href="/conta/dados">Meus dados</Link>. As mensagens saem pela API
          oficial do WhatsApp Business (Meta), que recebe o seu número e o texto da mensagem para fazer a entrega.
        </p>
      </>
    ),
  },
  {
    id: "busca-nominal",
    titulo: "Busca do seu nome em convocações",
    conteudo: (
      <>
        <p>
          No plano {PLANO_INFO.aprovado.nome}, podemos procurar o seu nome completo em atos de convocação e nomeação publicados no
          Diário Oficial e avisar você. Isso só acontece com a sua <strong>autorização explícita</strong>, dada em{" "}
          <Link href="/conta/dados">Meus dados</Link>, onde você informa o nome exatamente como aparece nos seus documentos.
        </p>
        <p>
          O nome é usado só para essa busca. Ao desligar a opção, paramos de procurar e apagamos o nome guardado para esse fim.
          Homônimos podem acontecer: sempre confira o ato oficial pelo link do aviso.
        </p>
      </>
    ),
  },
  {
    id: "compartilhamento",
    titulo: "Com quem compartilhamos",
    conteudo: (
      <>
        <p>Não vendemos nem alugamos seus dados. Compartilhamos só com empresas que operam o serviço para nós:</p>
        <ul>
          <li>Hospedagem do site e do banco de dados (Vercel e Supabase);</li>
          <li>Pagamentos (Asaas ou outro provedor de cobrança que viermos a usar);</li>
          <li>Notificações no celular (Expo, Apple e Google);</li>
          <li>Mensagens de WhatsApp (Meta), só para quem autorizou;</li>
          <li>E-mails transacionais (Resend);</li>
          <li>
            Leitura de editais e Pergunte ao edital com IA (Anthropic): enviamos o texto do edital e a pergunta, não os seus dados de
            conta.
          </li>
        </ul>
        <p>
          Alguns desses fornecedores guardam dados fora do Brasil. Nesses casos, a transferência segue o art. 33 da LGPD, com
          cláusulas contratuais de proteção <Revisar />. Também podemos compartilhar dados quando a lei ou uma ordem judicial exigir.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    titulo: "Por quanto tempo guardamos",
    conteudo: (
      <ul>
        <li>Dados da conta, perfis e acompanhamentos: enquanto a conta existir.</li>
        <li>Registros de acesso (data, hora e navegador): 6 meses, como pede o Marco Civil da Internet.</li>
        <li>
          Registros de pagamento: pelo prazo exigido pela legislação fiscal e de defesa do consumidor <Revisar>confirmar prazo, em
          geral 5 anos</Revisar>.
        </li>
        <li>Contatos deixados antes do lançamento: até 12 meses depois do lançamento, ou até você pedir para sair.</li>
        <li>Depois da exclusão da conta, os dados que identificam você são apagados ou anonimizados na hora.</li>
      </ul>
    ),
  },
  {
    id: "direitos",
    titulo: "Seus direitos",
    conteudo: (
      <>
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e acessar todos eles;</li>
          <li>corrigir dados incompletos ou desatualizados;</li>
          <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>levar seus dados para outro serviço (portabilidade);</li>
          <li>saber com quem compartilhamos;</li>
          <li>retirar consentimentos (WhatsApp, busca do nome, contato de lançamento);</li>
          <li>se opor a um tratamento e pedir revisão de decisões automatizadas.</li>
        </ul>
        <p>
          Boa parte disso você faz sozinho em <Link href="/conta/dados">Meus dados</Link>: corrigir nome e telefone, ligar e desligar
          consentimentos, <strong>baixar todos os seus dados</strong> em um arquivo e <strong>excluir a conta</strong>. Para o resto,
          escreva para {email}. Respondemos em até 15 dias <Revisar />. Você também pode reclamar à Autoridade Nacional de Proteção
          de Dados (ANPD).
        </p>
      </>
    ),
  },
  {
    id: "exclusao",
    titulo: "Exclusão de conta",
    conteudo: (
      <>
        <p>
          Em <Link href="/conta/dados">Meus dados</Link>, use “Excluir conta” e confirme digitando EXCLUIR. Na hora, nós cancelamos a
          assinatura (sem novas cobranças), encerramos todas as sessões, apagamos perfis de busca e aparelhos cadastrados e
          anonimizamos nome, e-mail e telefone.
        </p>
        <p>
          Registros de pagamento podem ser mantidos pelo prazo legal, sem ligação com os seus dados de contato <Revisar />. A exclusão
          não pode ser desfeita.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    titulo: "Segurança",
    conteudo: (
      <>
        <p>
          Usamos conexão criptografada (HTTPS), senhas com hash forte, sessões que você pode encerrar em{" "}
          <Link href="/conta/seguranca">Segurança</Link>, acesso restrito da equipe e registro de auditoria das ações administrativas.
        </p>
        <p>
          Nenhum sistema é infalível. Se acontecer um incidente que possa trazer risco relevante a você, avisaremos você e a ANPD,
          como pede o art. 48 da LGPD.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    titulo: "Cookies",
    conteudo: (
      <p>
        O site usa um único cookie essencial, de sessão, para manter você conectado na sua conta. Não usamos cookies de publicidade
        nem de rastreamento de terceiros <Revisar>atualizar se for adotada ferramenta de métricas</Revisar>.
      </p>
    ),
  },
  {
    id: "menores",
    titulo: "Menores de idade",
    conteudo: (
      <p>
        O Aviso Concurso é destinado a maiores de 18 anos. Se você é responsável por um menor que criou uma conta, escreva para{" "}
        {email} e excluiremos os dados <Revisar />.
      </p>
    ),
  },
  {
    id: "mudancas",
    titulo: "Mudanças nesta política",
    conteudo: (
      <p>
        Podemos atualizar esta política. Quando a mudança for relevante, avisaremos por e-mail ou no app antes de ela valer. A data
        da última atualização fica no topo da página.
      </p>
    ),
  },
];

export default function PaginaPrivacidade() {
  return (
    <DocumentoLegal
      rotulo="LGPD"
      titulo="Política de privacidade"
      atualizado="01/11/2026"
      resumo={
        <>
          <strong>Resumo:</strong> usamos o mínimo de dados para avisar você sobre concursos. WhatsApp e busca do seu nome no Diário
          Oficial só com a sua autorização. Não vendemos dados. Você baixa ou apaga tudo sozinho em{" "}
          <Link href="/conta/dados" className="font-semibold text-azul">
            Meus dados
          </Link>
          .
        </>
      }
      secoes={SECOES}
    />
  );
}
