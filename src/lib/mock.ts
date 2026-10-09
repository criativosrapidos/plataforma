// Dados de exemplo da "primeira cara". Tudo aqui some quando o banco entrar.
// Modelo já no formato final: conta > marcas > conteúdos.

import type { Ciclo, PlanId, TipoPeca } from "./plans";

export type StatusPeca = "a_aprovar" | "aprovada" | "baixada";
export type Formato = "4:5" | "9:16";

export type Marca = {
  id: string;
  nome: string;
  instagram: string;
  site?: string;
  segmento: string;
  produtos: string[];
  cores: string[]; // [fundo, destaque, apoio, claro]
  tom: string;
  publico: string;
  iniciais: string;
};

export type Peca = {
  id: string;
  marcaId: string;
  data: string; // AAAA-MM-DD
  hora: string;
  tipo: TipoPeca;
  formato: Formato;
  titulo: string;
  apoio: string;
  slides?: string[];
  duracao?: number;
  cta?: string;
  legenda: string;
  hashtags: string[];
  status: StatusPeca;
};

export type Conta = {
  nome: string;
  email: string;
  plano: PlanId;
  ciclo: Ciclo;
  creditosUsados: number;
  creditosAcumulados: number; // sobra do mês anterior (só no anual)
  creditosExtras: number;
  renovaEm: string;
};

export const CONTA: Conta = {
  nome: "Rafa Moreira",
  email: "rafa@brasaburger.com.br",
  plano: "profissional",
  ciclo: "anual",
  creditosUsados: 34,
  creditosAcumulados: 25,
  creditosExtras: 20,
  renovaEm: "2026-11-01",
};

export const MARCAS: Marca[] = [
  {
    id: "brasa",
    nome: "Brasa Burger",
    instagram: "@brasaburger",
    site: "brasaburger.com.br",
    segmento: "Hamburgueria artesanal",
    produtos: ["Smash Clássico", "Brasa Bacon", "Veggie da Casa", "Combo Família"],
    cores: ["#1A1410", "#E8452C", "#F2B33D", "#FFF4E0"],
    tom: "Descontraído",
    publico: "Jovens de 18 a 35 anos, região central, pedem por delivery à noite",
    iniciais: "BB",
  },
  {
    id: "forno",
    nome: "Forno Vivo Pizzaria",
    instagram: "@fornovivo",
    segmento: "Pizzaria napolitana",
    produtos: ["Margherita", "Calabresa da Casa", "Quatro Queijos"],
    cores: ["#1F3B2D", "#D9472B", "#F4E9D8", "#FFFDF8"],
    tom: "Acolhedor",
    publico: "Famílias, fim de semana",
    iniciais: "FV",
  },
  {
    id: "grao",
    nome: "Grão Nobre Café",
    instagram: "@graonobre",
    segmento: "Cafeteria",
    produtos: ["Espresso", "Cappuccino", "Pão de queijo"],
    cores: ["#2B1D16", "#C68B59", "#EAD7C3", "#FBF7F2"],
    tom: "Elegante",
    publico: "Profissionais, manhã e tarde",
    iniciais: "GN",
  },
];

const tags = ["#hamburgueria", "#smashburger", "#burgerartesanal", "#delivery", "#brasaburger"];

export const PECAS: Peca[] = [
  {
    id: "p1", marcaId: "brasa", data: "2026-10-01", hora: "18:00", tipo: "post", formato: "4:5",
    titulo: "Quinta é dia de smash", apoio: "Dois blends, cheddar derretido e pão brioche.",
    legenda: "Quinta-feira pede smash 🔥 Dois blends prensados na chapa, cheddar derretido e aquele pão brioche macio. Peça pelo link da bio!",
    hashtags: tags, status: "baixada",
  },
  {
    id: "p2", marcaId: "brasa", data: "2026-10-03", hora: "12:00", tipo: "carrossel", formato: "4:5",
    titulo: "3 erros que estragam seu burger", apoio: "O último quase todo mundo comete.",
    slides: ["Apertar a carne na chapa toda hora", "Pão frio e sem selar", "Queijo que não derrete", "Aqui na Brasa a gente resolve os 3"],
    legenda: "Salva esse post pra não errar mais no burger de casa 👇 E se bater a preguiça, a gente faz pra você.",
    hashtags: tags, status: "baixada",
  },
  {
    id: "p3", marcaId: "brasa", data: "2026-10-06", hora: "19:00", tipo: "video", formato: "9:16", duracao: 22,
    titulo: "Do pão ao prato em 20s", apoio: "Bastidores da chapa.",
    legenda: "Do pão ao prato em 20 segundos 🍔 Esse é o caminho do Brasa Bacon até você. Qual é o seu favorito?",
    hashtags: tags, status: "aprovada",
  },
  {
    id: "p4", marcaId: "brasa", data: "2026-10-08", hora: "18:00", tipo: "anuncio", formato: "4:5", cta: "Peça agora",
    titulo: "Combo Família por R$ 89", apoio: "4 burgers + 2 fritas grandes. Só no delivery.",
    legenda: "Combo Família: 4 burgers + 2 fritas grandes por R$ 89. Válido de segunda a quinta no delivery.",
    hashtags: tags, status: "aprovada",
  },
  {
    id: "p5", marcaId: "brasa", data: "2026-10-10", hora: "11:00", tipo: "stories", formato: "9:16",
    titulo: "Enquete: bacon ou cheddar?", apoio: "Vota aí que a gente conta o resultado.",
    legenda: "Enquete nos stories: bacon ou cheddar extra?",
    hashtags: tags, status: "a_aprovar",
  },
  {
    id: "p6", marcaId: "brasa", data: "2026-10-13", hora: "18:30", tipo: "post", formato: "4:5",
    titulo: "Conheça o Veggie da Casa", apoio: "Burger de grão-de-bico que até carnívoro pede de novo.",
    legenda: "Ninguém acredita que é veggie até provar 🌱 Burger de grão-de-bico, maionese de ervas e picles da casa.",
    hashtags: [...tags, "#veggie"], status: "a_aprovar",
  },
  {
    id: "p7", marcaId: "brasa", data: "2026-10-15", hora: "19:00", tipo: "video", formato: "9:16", duracao: 28,
    titulo: "Dia do Burger Duplo", apoio: "Só hoje: o segundo sai pela metade.",
    legenda: "Hoje é dia de dobrar 🍔🍔 Na compra de um burger, o segundo sai pela metade. Só hoje, só no balcão e no delivery.",
    hashtags: tags, status: "a_aprovar",
  },
  {
    id: "p8", marcaId: "brasa", data: "2026-10-17", hora: "12:00", tipo: "carrossel", formato: "4:5",
    titulo: "Monte o burger perfeito", apoio: "Guia em 4 passos.",
    slides: ["Escolha o blend", "Escolha o queijo", "Escolha o molho", "Peça no link da bio"],
    legenda: "Seu burger, do seu jeito. Desliza pro lado e monta o seu 👉",
    hashtags: tags, status: "a_aprovar",
  },
  {
    id: "p9", marcaId: "brasa", data: "2026-10-20", hora: "18:00", tipo: "anuncio", formato: "9:16", cta: "Pedir no delivery",
    titulo: "Frete grátis toda terça", apoio: "Pedidos acima de R$ 50 na região central.",
    legenda: "Terça sem frete 🛵 Pedidos acima de R$ 50 na região central.",
    hashtags: tags, status: "a_aprovar",
  },
  {
    id: "p10", marcaId: "brasa", data: "2026-10-23", hora: "18:30", tipo: "post", formato: "4:5",
    titulo: "Avaliação 4,9 no delivery", apoio: "Obrigado por cada pedido.",
    legenda: "4,9 de nota no delivery e o mérito é de vocês ❤️ Obrigado por cada pedido!",
    hashtags: tags, status: "a_aprovar",
  },
  {
    id: "p11", marcaId: "brasa", data: "2026-10-27", hora: "19:00", tipo: "video", formato: "9:16", duracao: 18,
    titulo: "Batata rústica nova", apoio: "Crocante por fora, macia por dentro.",
    legenda: "Chegou a batata rústica com páprica e alecrim 🍟 Já pede junto com seu combo.",
    hashtags: tags, status: "a_aprovar",
  },
  {
    id: "p12", marcaId: "brasa", data: "2026-10-31", hora: "18:00", tipo: "post", formato: "4:5",
    titulo: "Halloween na Brasa", apoio: "Burger preto com cheddar laranja. Só no dia 31.",
    legenda: "Gostosuras sem travessuras 🎃 Burger com pão preto e cheddar laranja, só neste sábado.",
    hashtags: [...tags, "#halloween"], status: "a_aprovar",
  },
  // Outras marcas (plano Profissional)
  {
    id: "f1", marcaId: "forno", data: "2026-10-04", hora: "19:00", tipo: "post", formato: "4:5",
    titulo: "Domingo pede pizza", apoio: "Massa de 48h no forno a lenha.", legenda: "Domingo é dia de pizza em família 🍕",
    hashtags: ["#pizza", "#napolitana"], status: "aprovada",
  },
  {
    id: "f2", marcaId: "forno", data: "2026-10-11", hora: "19:00", tipo: "video", formato: "9:16", duracao: 25,
    titulo: "90 segundos no forno", apoio: "É o tempo de uma napolitana.", legenda: "90 segundos a 450 °C. Esse é o segredo.",
    hashtags: ["#pizza", "#fornoalenha"], status: "a_aprovar",
  },
  {
    id: "g1", marcaId: "grao", data: "2026-10-01", hora: "08:00", tipo: "post", formato: "4:5",
    titulo: "Dia Internacional do Café", apoio: "Espresso em dobro pra comemorar.", legenda: "Hoje é Dia Internacional do Café ☕",
    hashtags: ["#cafe", "#espresso"], status: "a_aprovar",
  },
];

export const MES_ATUAL = { ano: 2026, mes: 10, nome: "Outubro" };

export const TIPO_LABEL: Record<TipoPeca, string> = {
  post: "Post",
  carrossel: "Carrossel",
  video: "Vídeo",
  anuncio: "Anúncio",
  stories: "Stories",
};

export const STATUS_LABEL: Record<StatusPeca, string> = {
  a_aprovar: "A aprovar",
  aprovada: "Aprovada",
  baixada: "Baixada",
};
