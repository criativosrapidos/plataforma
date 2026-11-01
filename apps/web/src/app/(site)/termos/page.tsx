import type { Metadata } from "next";
import Link from "next/link";
import { DIAS_TOLERANCIA_INADIMPLENCIA, PLANO_INFO, TRIAL_DAYS, brl } from "@aviso/shared";
import { DocumentoLegal, Revisar, type SecaoLegal } from "@/components/site/DocumentoLegal";
import { EMAIL_CONTATO } from "@/components/site/conteudo";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "As regras do Aviso Concurso: o que o serviço faz, teste grátis, assinatura, cancelamento, limites dos planos e responsabilidades.",
  alternates: { canonical: "/termos" },
};

const A = PLANO_INFO.aviso;
const B = PLANO_INFO.aprovado;

const SECOES: SecaoLegal[] = [
  {
    id: "aceite",
    titulo: "Aceite",
    conteudo: (
      <p>
        Ao criar uma conta ou usar o Aviso Concurso (app, site e área do cliente), você concorda com estes termos e com a{" "}
        <Link href="/privacidade">política de privacidade</Link>. Se não concordar, não use o serviço.
      </p>
    ),
  },
  {
    id: "servico",
    titulo: "O que o serviço faz",
    conteudo: (
      <>
        <p>
          O Aviso Concurso lê diários oficiais e sites de bancas organizadoras, identifica atos de concursos públicos e avisa você
          conforme os perfis de busca que você configurar. Também organiza as datas e as matérias dos concursos que você acompanha.
        </p>
        <ul>
          <li>Não somos órgão público nem banca organizadora, e não temos relação com eles.</li>
          <li>Não fazemos inscrição em concurso, não damos aula e não vendemos material de estudo.</li>
          <li>Não prometemos aprovação. Prometemos fazer o possível para você não perder uma data.</li>
        </ul>
      </>
    ),
  },
  {
    id: "conta",
    titulo: "Sua conta",
    conteudo: (
      <ul>
        <li>Você precisa ter 18 anos ou mais e informar dados verdadeiros.</li>
        <li>A conta é pessoal. Guarde sua senha e encerre sessões que não reconhecer em Segurança.</li>
        <li>Avise a gente em {EMAIL_CONTATO} se suspeitar de uso indevido.</li>
      </ul>
    ),
  },
  {
    id: "teste-assinatura",
    titulo: "Teste grátis e assinatura",
    conteudo: (
      <>
        <p>
          Não existe plano grátis. Cada pessoa tem direito a um teste de {TRIAL_DAYS} dias no plano escolhido. Para começar, você
          cadastra o Pix automático ou o cartão de crédito. Se não cancelar durante o teste, a primeira cobrança acontece no{" "}
          {TRIAL_DAYS + 1}º dia, e avisamos 1 dia antes.
        </p>
        <p>Preços atuais:</p>
        <ul>
          <li>
            {A.nome}: {brl(A.precoMensalCentavos)} por mês ou {brl(A.precoAnualCentavos)} por ano.
          </li>
          <li>
            {B.nome}: {brl(B.precoMensalCentavos)} por mês ou {brl(B.precoAnualCentavos)} por ano.
          </li>
        </ul>
        <p>
          A assinatura renova automaticamente ao fim de cada período, até você cancelar. Mudanças de preço serão avisadas com pelo
          menos 30 dias de antecedência e valem a partir da renovação seguinte <Revisar />.
        </p>
        <p>
          Se uma cobrança falhar, você continua com acesso por {DIAS_TOLERANCIA_INADIMPLENCIA} dias para regularizar. Depois disso,
          o app mostra só a tela de planos até o pagamento ser feito.
        </p>
      </>
    ),
  },
  {
    id: "cancelamento",
    titulo: "Cancelamento e reembolso",
    conteudo: (
      <>
        <p>
          Você cancela quando quiser, pelo app ou em <Link href="/conta/assinatura">Assinatura</Link>, sem multa. O acesso continua
          até o fim do período já pago (ou do teste) e não há nova cobrança.
        </p>
        <p>
          Pelo direito de arrependimento do Código de Defesa do Consumidor (art. 49), se você pedir o cancelamento em até 7 dias
          depois da primeira cobrança, devolvemos o valor integral <Revisar>confirmar regra para assinatura com teste grátis</Revisar>.
          Fora desse prazo, não há reembolso proporcional do período em curso.
        </p>
      </>
    ),
  },
  {
    id: "limites",
    titulo: "Limites dos planos",
    conteudo: (
      <ul>
        <li>
          WhatsApp ({B.nome}): até {B.limites.whatsappMes} mensagens por mês, só para isenção ou inscrição que acaba no dia seguinte, e
          só com o seu consentimento.
        </li>
        <li>
          Pergunte ao edital ({B.nome}): até {B.limites.perguntasMes} perguntas por mês. As respostas usam só o texto do edital e
          citam item e página; se a resposta não estiver no edital, o app diz que não encontrou.
        </li>
        <li>Os limites reiniciam todo mês, no fuso de Brasília, e não acumulam.</li>
      </ul>
    ),
  },
  {
    id: "informacoes",
    titulo: "Precisão das informações",
    conteudo: (
      <>
        <p>
          As informações vêm de fontes oficiais e passam por leitura automatizada e, quando há dúvida, por revisão humana. Mesmo
          assim, podem existir atrasos de publicação, falhas nos sites de origem ou erros de leitura.
        </p>
        <p>
          <strong>O edital oficial é sempre a referência.</strong> Todo aviso traz o link da fonte: confira prazos, requisitos e
          valores antes de pagar a taxa ou tomar qualquer decisão. Não nos responsabilizamos por decisões tomadas sem essa conferência,
          nem por indisponibilidade de sites de terceiros <Revisar />.
        </p>
      </>
    ),
  },
  {
    id: "uso",
    titulo: "Uso aceitável",
    conteudo: (
      <ul>
        <li>Não revenda, copie em massa ou republique o conteúdo do serviço.</li>
        <li>Não use robôs para extrair dados do site ou da API.</li>
        <li>Não tente burlar limites dos planos, acessar contas de outras pessoas ou atrapalhar o funcionamento do serviço.</li>
      </ul>
    ),
  },
  {
    id: "propriedade",
    titulo: "Propriedade intelectual",
    conteudo: (
      <p>
        A marca, o app, o site, os textos e a organização dos dados pertencem ao Aviso Concurso. Os atos oficiais são públicos e
        continuam sendo de quem os publicou.
      </p>
    ),
  },
  {
    id: "mudancas",
    titulo: "Mudanças no serviço e nos termos",
    conteudo: (
      <p>
        O serviço pode mudar para melhorar. Mudanças relevantes nestes termos serão avisadas por e-mail ou no app antes de valer. Se
        não concordar, você pode cancelar a qualquer momento.
      </p>
    ),
  },
  {
    id: "encerramento",
    titulo: "Suspensão e encerramento",
    conteudo: (
      <p>
        Podemos suspender ou encerrar contas que violem estes termos, com aviso prévio sempre que possível. Você pode excluir a sua
        conta quando quiser, em <Link href="/conta/dados">Meus dados</Link>.
      </p>
    ),
  },
  {
    id: "lei",
    titulo: "Lei aplicável e contato",
    conteudo: (
      <p>
        Estes termos seguem a lei brasileira, incluindo o Código de Defesa do Consumidor. Fica eleito o foro do domicílio do
        consumidor. Dúvidas: {EMAIL_CONTATO}. Razão social e CNPJ: <Revisar>preencher</Revisar>.
      </p>
    ),
  },
];

export default function PaginaTermos() {
  return (
    <DocumentoLegal
      rotulo="Termos"
      titulo="Termos de uso"
      atualizado="01/11/2026"
      resumo={
        <>
          <strong>Resumo:</strong> a gente avisa e organiza, você estuda e se inscreve no site oficial da banca. {TRIAL_DAYS} dias
          grátis, depois assinatura mensal ou anual, cancele quando quiser. O edital oficial é sempre a referência.
        </>
      }
      secoes={SECOES}
    />
  );
}
