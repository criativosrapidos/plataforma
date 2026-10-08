// Fonte única dos planos: usada na página inicial, no cadastro e em "Plano e uso".
// Quando o backend existir, esses limites viram a tabela `plans` no banco.

export type PlanId = "gratis" | "basico" | "profissional";

export type Plan = {
  id: PlanId;
  nome: string;
  paraQuem: string;
  precoMensal: number; // em reais, plano mensal (sem fidelidade)
  precoAnual: number; // em reais, total do plano anual (≈ 2 meses grátis)
  creditosMes: number; // renovam todo mês, no dia da assinatura
  marcas: number;
  usuarios: number;
  videos: boolean;
  anuncios: boolean;
  marcaDagua: boolean;
  linkAprovacao: boolean;
  whiteLabel: boolean;
  comprarCreditos: boolean;
  destaque?: boolean;
  inclui: string[];
  naoInclui?: string[];
};

// Quanto cada peça consome. Vídeo custa mais porque tem render + locução.
export const CUSTO_CREDITOS = {
  post: 1,
  anuncio: 1,
  stories: 1,
  carrossel: 2,
  video: 4,
} as const;

export type TipoPeca = keyof typeof CUSTO_CREDITOS;

export const PLANS: Plan[] = [
  {
    id: "gratis",
    nome: "Grátis",
    paraQuem: "Pra testar sem compromisso",
    precoMensal: 0,
    precoAnual: 0,
    creditosMes: 10,
    marcas: 1,
    usuarios: 1,
    videos: false,
    anuncios: false,
    marcaDagua: true,
    linkAprovacao: false,
    whiteLabel: false,
    comprarCreditos: false,
    inclui: [
      "10 créditos por mês (≈ 10 posts)",
      "1 marca e 1 usuário",
      "Posts, carrosséis e stories",
      "Legenda e hashtags prontas",
      "Calendário do mês",
    ],
    naoInclui: ["Vídeos e criativos de anúncio", "Download sem marca d'água"],
  },
  {
    id: "basico",
    nome: "Básico",
    paraQuem: "Pro dono que cuida do próprio Instagram",
    precoMensal: 49.9,
    precoAnual: 499.9,
    creditosMes: 60,
    marcas: 1,
    usuarios: 1,
    videos: true,
    anuncios: true,
    marcaDagua: false,
    linkAprovacao: false,
    whiteLabel: false,
    comprarCreditos: true,
    destaque: true,
    inclui: [
      "60 créditos por mês (≈ 30 peças)",
      "1 marca e 1 usuário",
      "Posts, carrosséis, stories e anúncios",
      "Vídeos de até 30s com locução",
      "Download sem marca d'água",
      "Créditos extras quando precisar",
    ],
  },
  {
    id: "profissional",
    nome: "Profissional",
    paraQuem: "Pra agências e social medias",
    precoMensal: 99.9,
    precoAnual: 999.9,
    creditosMes: 200,
    marcas: 5,
    usuarios: 3,
    videos: true,
    anuncios: true,
    marcaDagua: false,
    linkAprovacao: true,
    whiteLabel: true,
    comprarCreditos: true,
    inclui: [
      "200 créditos por mês (≈ 100 peças)",
      "Até 5 marcas e 3 usuários",
      "Tudo do Básico",
      "Link de aprovação pro seu cliente",
      "Sua logo no lugar da nossa",
      "Suporte prioritário no WhatsApp",
    ],
  },
];

export const PACOTES_CREDITOS = [
  { id: "p20", creditos: 20, preco: 19.9 },
  { id: "p50", creditos: 50, preco: 39.9, destaque: true },
  { id: "p120", creditos: 120, preco: 79.9 },
];

export function getPlan(id: PlanId) {
  return PLANS.find((p) => p.id === id)!;
}

export function brl(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Valor de cada parcela no anual (12x no cartão) — também é o "por mês" do anual.
export function mensalNoAnual(plan: Plan) {
  return Math.round((plan.precoAnual / 12) * 100) / 100;
}

// Quantos meses de graça o anual dá em relação ao mensal.
export function mesesGratis(plan: Plan) {
  return plan.precoMensal ? Math.round(12 - plan.precoAnual / plan.precoMensal) : 0;
}
