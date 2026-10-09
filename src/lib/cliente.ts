// Área do cliente do serviço de criativos (sem IA): pacote, entregas, aprovação, calendário e briefing.
// Dados de exemplo em memória. Quando o banco entrar, vira: clientes > pedidos > entregas.

import type { Peca } from "./mock";
import type { Pacote } from "./pacotes";

export type StatusEntrega = "producao" | "aprovar" | "ajuste" | "aprovada";

export const STATUS_ENTREGA: Record<StatusEntrega, string> = {
  producao: "Em produção",
  aprovar: "Para aprovar",
  ajuste: "Em ajuste",
  aprovada: "Aprovada",
};

export type Comentario = { autor: "cliente" | "agencia"; texto: string; quando: string };

export type Entrega = Omit<Peca, "status" | "tipo" | "hashtags"> & {
  tipo: "video" | "carrossel";
  status: StatusEntrega;
  comentarios: Comentario[];
  hashtags: string[];
};

export type Briefing = {
  negocio: string;
  segmento: string;
  produtos: string;
  publico: string;
  diferencial: string;
  tom: string;
  cores: string[];
  referencias: string;
  evitar: string;
  datas: string;
  arquivos: string[];
};

export type Cliente = {
  id: string;
  nome: string;
  marcaId: string;
  marca: string;
  instagram: string;
  instagramConectado: boolean;
  seguidores: number;
  pacote: Pacote["id"];
  compradoEm: string;
  briefing: Briefing | null;
};

export const BRIEFING_VAZIO: Briefing = {
  negocio: "",
  segmento: "",
  produtos: "",
  publico: "",
  diferencial: "",
  tom: "Descontraído",
  cores: ["#101216", "#FFD400", "#FFFFFF"],
  referencias: "",
  evitar: "",
  datas: "",
  arquivos: [],
};

export const TONS = ["Descontraído", "Acolhedor", "Elegante", "Direto", "Divertido", "Técnico"];

const BRIEFING_BRASA: Briefing = {
  negocio: "Brasa Burger",
  segmento: "Hamburgueria artesanal",
  produtos: "Smash Clássico, Brasa Bacon, Veggie da Casa, Combo Família",
  publico: "Jovens de 18 a 35 anos, região central, pedem delivery à noite",
  diferencial: "Blend próprio prensado na chapa e pão brioche feito na casa",
  tom: "Descontraído",
  cores: ["#1A1410", "#E8452C", "#F2B33D", "#FFF4E0"],
  referencias: "@hamburgueriaexemplo, @smashclub",
  evitar: "Não usar fotos de carne crua. Nada de humor com bebida alcoólica.",
  datas: "Halloween (31/10), promoção de terça com frete grátis",
  arquivos: ["logo-brasa.png", "fotos-cozinha.zip", "cardapio-outubro.pdf"],
};

const tags = ["#hamburgueria", "#smashburger", "#burgerartesanal", "#delivery", "#brasaburger"];

const BASE: Array<[StatusEntrega, "video" | "carrossel", string, string, string]> = [
  ["aprovada", "video", "2026-10-02", "Do pão ao prato em 20s", "Bastidores da chapa."],
  ["aprovada", "carrossel", "2026-10-03", "3 erros que estragam seu burger", "O último quase todo mundo comete."],
  ["aprovada", "video", "2026-10-06", "Quinta é dia de smash", "Dois blends e cheddar derretido."],
  ["aprovada", "carrossel", "2026-10-08", "Combo Família por R$ 89", "4 burgers + 2 fritas grandes."],
  ["aprovada", "video", "2026-10-10", "Frete grátis toda terça", "Pedidos acima de R$ 50."],
  ["aprovada", "carrossel", "2026-10-11", "Conheça o Veggie da Casa", "Grão-de-bico e maionese de ervas."],
  ["aprovar", "video", "2026-10-13", "Batata rústica nova", "Crocante por fora, macia por dentro."],
  ["aprovar", "carrossel", "2026-10-15", "Monte o burger perfeito", "Guia em 4 passos."],
  ["aprovar", "video", "2026-10-17", "Dia do Burger Duplo", "O segundo sai pela metade."],
  ["ajuste", "carrossel", "2026-10-18", "Avaliação 4,9 no delivery", "Obrigado por cada pedido."],
  ["producao", "video", "2026-10-20", "Como nasce o Brasa Bacon", "Do blend ao bacon crocante."],
  ["producao", "carrossel", "2026-10-22", "5 combinações que você precisa provar", "Salva pra pedir depois."],
  ["producao", "video", "2026-10-24", "Pedido saindo às 20h", "Uma noite no delivery."],
  ["producao", "carrossel", "2026-10-25", "Burger x pizza: a gente responde", "Spoiler: burger."],
  ["producao", "video", "2026-10-27", "Equipe da Brasa", "Quem faz o seu burger."],
  ["producao", "carrossel", "2026-10-28", "Cardápio de outubro", "Tudo que tem de novo."],
  ["producao", "video", "2026-10-29", "Halloween na Brasa", "Pão preto e cheddar laranja."],
  ["producao", "carrossel", "2026-10-30", "Guia do Halloween", "O que pedir no dia 31."],
  ["producao", "video", "2026-10-31", "Hoje é Halloween", "Só hoje, burger preto."],
  ["producao", "carrossel", "2026-10-31", "Obrigado, outubro", "Os números do mês."],
];

export const ENTREGAS: Entrega[] = BASE.map(([status, tipo, data, titulo, apoio], i) => ({
  id: `e${i + 1}`,
  marcaId: "brasa",
  data,
  hora: tipo === "video" ? "19:00" : "12:00",
  tipo,
  formato: tipo === "video" ? "9:16" : "4:5",
  titulo,
  apoio,
  duracao: tipo === "video" ? 18 + (i % 4) * 3 : undefined,
  slides: tipo === "carrossel" ? ["O primeiro ponto", "O segundo ponto", "O terceiro ponto", "Peça pelo link da bio"] : undefined,
  legenda: `${titulo} 🔥 ${apoio} Peça pelo link da bio!`,
  hashtags: tags,
  status,
  comentarios:
    status === "ajuste"
      ? [
          { autor: "cliente", texto: "Troca a nota pra 4,9 em destaque e coloca o logo do iFood.", quando: "08/10, 14:12" },
          { autor: "agencia", texto: "Feito o pedido! Entregamos a nova versão até amanhã.", quando: "08/10, 15:03" },
        ]
      : [],
}));

export const CLIENTE: Cliente = {
  id: "c1",
  nome: "Rafa Moreira",
  marcaId: "brasa",
  marca: "Brasa Burger",
  instagram: "@brasaburger",
  instagramConectado: false,
  seguidores: 4820,
  pacote: "max",
  compradoEm: "2026-10-01",
  briefing: BRIEFING_BRASA,
};

// Visão da agência: todos os clientes e o andamento de cada pedido.
export const CLIENTES_AGENCIA = [
  { id: "c1", marca: "Brasa Burger", instagram: "@brasaburger", pacote: "max" as const, entregues: 10, aprovar: 3, ajustes: 1, briefing: true, prazo: "2026-10-15" },
  { id: "c2", marca: "Forno Vivo Pizzaria", instagram: "@fornovivo", pacote: "pro" as const, entregues: 4, aprovar: 2, ajustes: 0, briefing: true, prazo: "2026-10-12" },
  { id: "c3", marca: "Grão Nobre Café", instagram: "@graonobre", pacote: "start" as const, entregues: 0, aprovar: 0, ajustes: 0, briefing: false, prazo: "2026-10-13" },
  { id: "c4", marca: "Studio Bella Estética", instagram: "@studiobella", pacote: "pro" as const, entregues: 10, aprovar: 0, ajustes: 0, briefing: true, prazo: "2026-10-05" },
];
