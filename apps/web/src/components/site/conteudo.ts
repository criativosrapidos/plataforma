// Textos compartilhados entre a landing e as páginas internas do site.
import { BANCAS, PLANO_INFO, TRIAL_DAYS, brl } from "@aviso/shared";

export const EMAIL_CONTATO = "contato@avisoconcurso.com.br";
export const EMAIL_PRIVACIDADE = "privacidade@avisoconcurso.com.br";
export const INSTAGRAM = "https://www.instagram.com/avisoconcurso";

/** "R$ 99" quando é valor redondo, "R$ 9,90" quando tem centavos. */
export function precoCurto(centavos: number) {
  return centavos % 100 === 0 ? `R$ ${centavos / 100}` : brl(centavos);
}

export const PRECO_AVISO = brl(PLANO_INFO.aviso.precoMensalCentavos);
export const PRECO_APROVADO = brl(PLANO_INFO.aprovado.precoMensalCentavos);

export const PASSOS = [
  {
    letra: "A",
    titulo: "Monte seu perfil",
    texto: "Escolaridade, área, cargo, estados, salário mínimo, bancas e palavras-chave. Quantos perfis quiser.",
    detalhe:
      "Estuda para tribunal em SP e também para INSS? Crie um perfil para cada coisa. Filtro vazio não restringe: deixe em branco o que tanto faz.",
  },
  {
    letra: "B",
    titulo: "A gente lê tudo, todo dia",
    texto: "Diário Oficial da União, diários de estados e municípios e os sites das bancas.",
    detalhe:
      "O Diário Oficial da União é lido logo cedo e os sites das bancas, a cada hora. O que é concurso vira campos que dá para filtrar: vagas, salário, datas, matérias.",
  },
  {
    letra: "C",
    titulo: "Notificação na hora",
    texto: "Saiu concurso do seu perfil? O celular apita com vagas, salário, prazos e o link oficial.",
    detalhe: "A meta é avisar em até 1 hora depois da publicação. Toda notificação leva o link da fonte oficial, para você conferir.",
  },
  {
    letra: "D",
    titulo: "Acompanha até o resultado",
    texto: "Isenção, fim da inscrição, errata, local de prova, prova, gabarito, resultado e convocação.",
    detalhe:
      "Acompanhe quantos concursos quiser. Cada um ganha uma cor na agenda, um checklist e contagem regressiva para a prova. Saiu errata? A agenda se atualiza sozinha.",
  },
] as const;

export const CICLO = [
  { nome: "Previsto", texto: "Órgão pede vagas ao ministério", aprovado: true },
  { nome: "Autorizado", texto: "Portaria publicada no Diário Oficial", aprovado: true },
  { nome: "Banca", texto: "Organizadora contratada", aprovado: false },
  { nome: "Edital", texto: "Resumo e prazos no mesmo dia", aprovado: false },
  { nome: "Prova", texto: "Local, horário e gabarito", aprovado: false },
  { nome: "Resultado", texto: "Classificação e convocação", aprovado: false },
] as const;

export const TIPOS_DE_AVISO = [
  { nome: "Edital publicado", texto: "Concurso novo que combina com algum perfil seu, com resumo e link oficial." },
  { nome: "Isenção acabando", texto: "Lembrete antes do fim do pedido de isenção da taxa, que costuma fechar bem antes da inscrição." },
  { nome: "Inscrição acabando", texto: "Lembrete antes do fim das inscrições e do vencimento do boleto." },
  { nome: "Errata", texto: "O edital mudou? Você recebe só o que mudou, e a agenda já vem atualizada." },
  { nome: "Local de prova", texto: "Aviso quando a banca divulga onde você faz a prova." },
  { nome: "Prova amanhã", texto: "Lembrete na véspera, com o checklist: documento com foto e caneta preta de tubo transparente." },
  { nome: "Gabarito e resultado", texto: "Aviso quando sai o gabarito preliminar, o definitivo e o resultado." },
  { nome: "Autorizado e convocação", texto: "No plano Aprovado: concurso autorizado em portaria e seu nome em convocação no Diário Oficial." },
] as const;

export const FONTES = [
  {
    nome: "Diário Oficial da União",
    traz: "Editais federais, autorizações, homologações e nomeações",
    como: "Download diário do DOU em XML pelo INLABS, da Imprensa Nacional",
    frequencia: "Todo dia, logo cedo",
    fase: "no ar",
  },
  {
    nome: "Sites das bancas",
    traz: BANCAS.join(", "),
    como: "Leitura da página de concursos de cada banca, avisando quando aparece item novo",
    frequencia: "A cada hora",
    fase: "no ar",
  },
  {
    nome: "Diários municipais",
    traz: "Prefeituras e câmaras",
    como: "API do Querido Diário (Open Knowledge Brasil). A cobertura de cidades ainda é parcial",
    frequencia: "A cada 6 horas",
    fase: "no ar",
  },
  {
    nome: "Diários estaduais",
    traz: "Concursos do estado, TJ, MP, PM, PC e Sefaz",
    como: "Um coletor por estado, começando por SP, MG, RJ, BA, PR, RS e DF",
    frequencia: "Diário",
    fase: "em breve",
  },
] as const;

export const COMPARACAO = [
  { item: "Onde procurar", sozinho: "Diários, bancas, portais e grupos", aviso: "Um lugar só" },
  { item: "Quando você fica sabendo", sozinho: "Quando lembra de olhar", aviso: "Minutos depois da publicação" },
  { item: "Prazo de isenção", sozinho: "Fácil de perder", aviso: "Lembrete antes de acabar" },
  { item: "Errata", sozinho: "Ler o edital de novo", aviso: "Só o que mudou, agenda atualizada" },
  { item: "Vários concursos", sozinho: "Planilha e calendário à mão", aviso: "Uma agenda com uma cor por concurso" },
  { item: "Link falso", sozinho: "Risco", aviso: "Sempre a fonte oficial" },
] as const;

export type Pergunta = { p: string; r: string };
export type GrupoDuvidas = { id: string; titulo: string; itens: Pergunta[] };

export const DUVIDAS: GrupoDuvidas[] = [
  {
    id: "teste-e-planos",
    titulo: "Teste e planos",
    itens: [
      {
        p: `Como funciona o teste de ${TRIAL_DAYS} dias?`,
        r: `Você escolhe o plano, cadastra o Pix automático ou o cartão e usa tudo por ${TRIAL_DAYS} dias sem pagar. A primeira cobrança só acontece no 4º dia, e a gente avisa 1 dia antes. Se cancelar antes, não paga nada.`,
      },
      {
        p: "Tem plano grátis?",
        r: `Não. Todo mundo entra pelo teste de ${TRIAL_DAYS} dias com o plano completo e decide se continua. Depois, o plano Aviso custa ${PRECO_AVISO} por mês.`,
      },
      {
        p: "Qual a diferença entre o Aviso e o Aprovado?",
        r: "O Aviso tem tudo para não perder data: notificação na hora, lembretes de isenção e inscrição, erratas, agenda, matérias em comum e checklist. O Aprovado soma o WhatsApp para prazos acabando (até 10 por mês), o Pergunte ao edital com IA (30 perguntas por mês), o radar de concursos previstos e autorizados e o aviso de convocação com o seu nome no Diário Oficial.",
      },
      {
        p: "Posso cancelar quando quiser?",
        r: "Pode. Sem multa e sem fidelidade. Você continua usando até o fim do período que já pagou (ou do teste) e não é cobrado de novo.",
      },
      {
        p: "Quais formas de pagamento vocês aceitam?",
        r: "Pix automático ou cartão de crédito. No plano anual você paga uma vez por ano e sai mais barato: o equivalente a 2 meses grátis.",
      },
      {
        p: "Posso trocar de plano depois?",
        r: "Pode, a qualquer momento, na sua conta pelo site ou no app. A troca vale a partir da próxima cobrança.",
      },
    ],
  },
  {
    id: "avisos",
    titulo: "Avisos e agenda",
    itens: [
      {
        p: "O aviso chega pelo WhatsApp?",
        r: "O aviso principal chega como notificação do app, na hora e sem limite. No plano Aprovado, os prazos que acabam no dia seguinte (isenção e inscrição) também chegam no WhatsApp, até 10 por mês, só se você autorizar.",
      },
      {
        p: "Quanto tempo depois da publicação chega o aviso?",
        r: "O Diário Oficial da União é lido logo cedo e os sites das bancas, a cada hora. A meta é avisar em até 1 hora depois da publicação.",
      },
      {
        p: "Quais concursos vocês cobrem?",
        r: "Federais, estaduais e municipais publicados em diários oficiais e nos sites das principais bancas. Começamos pelo Diário Oficial da União, pelas bancas e pelos diários municipais do Querido Diário, e ampliamos os diários estaduais a cada mês.",
      },
      {
        p: "Dá para acompanhar vários concursos ao mesmo tempo?",
        r: "Dá, quantos quiser. Cada concurso ganha uma cor na agenda, com isenção, inscrição, local de prova e prova, e a contagem regressiva. A aba Matérias mostra primeiro o que cai em mais de um edital.",
      },
      {
        p: "E se sair uma errata?",
        r: "A gente compara a versão nova com a anterior, te avisa só o que mudou e já atualiza a sua agenda. Só quem acompanha aquele concurso recebe.",
      },
    ],
  },
  {
    id: "confianca",
    titulo: "Confiança e dados",
    itens: [
      {
        p: "De onde vêm as informações?",
        r: "Só de fonte pública e oficial: Diário Oficial da União, diários dos estados e municípios e sites das bancas. Todo aviso traz o link da fonte para você conferir.",
      },
      {
        p: "Vocês fazem a minha inscrição?",
        r: "Não. A inscrição é feita no site oficial da banca. A gente avisa e manda o link certo. Desconfie de qualquer site que peça pagamento de taxa fora da banca organizadora.",
      },
      {
        p: "Vocês dão aula ou vendem curso?",
        r: "Não. A gente avisa e organiza: editais, prazos, agenda e matérias em comum. O estudo é com você.",
      },
      {
        p: "Vocês têm lado político?",
        r: "Não. A gente fala de edital, vaga e prazo. Notícia sobre previsão só entra com fonte oficial.",
      },
      {
        p: "O que vocês fazem com os meus dados?",
        r: "Usamos o mínimo para avisar você: seu e-mail, seus perfis de busca e os concursos que acompanha. O WhatsApp e a busca do seu nome em convocações só funcionam com a sua autorização, e você pode baixar ou apagar tudo na sua conta. Detalhes na política de privacidade.",
      },
    ],
  },
];

/** Perguntas mais comuns, para a landing. */
export const DUVIDAS_DESTAQUE: Pergunta[] = [
  DUVIDAS[0].itens[0],
  DUVIDAS[1].itens[0],
  DUVIDAS[2].itens[1],
  DUVIDAS[1].itens[2],
  DUVIDAS[1].itens[1],
  DUVIDAS[2].itens[2],
  DUVIDAS[2].itens[3],
  DUVIDAS[0].itens[3],
];
