// Pacotes de produção de criativos (o que o site vende hoje).
// Quantidades e prazos são sugestões: confirmar com os sócios.

// Os 5 tipos de criativo, na ordem de foco (do que mais vende pro que mais relaciona).
export type Tipo = "anuncio" | "reel" | "carrossel" | "post" | "story";

export const TIPOS: { id: Tipo; um: string; varios: string; desc: string }[] = [
  { id: "anuncio", um: "anúncio", varios: "anúncios", desc: "Vídeo e imagem focados em vender, prontos pra rodar no Instagram e Facebook." },
  { id: "reel", um: "reel", varios: "reels", desc: "Vídeos verticais com animação, locução e música, pra alcançar gente nova." },
  { id: "carrossel", um: "carrossel", varios: "carrosséis", desc: "Conteúdo que ensina e vende, deslizando no feed." },
  { id: "post", um: "post", varios: "posts", desc: "Peça única pro feed, com a sua logo e as suas cores." },
  { id: "story", um: "story", varios: "stories", desc: "Peças pro dia a dia nos stories, com chamada pra ação." },
];

export type Pacote = {
  id: "largada" | "acelera" | "turbo";
  nome: string;
  paraQuem: string;
  itens: Record<Tipo, number>;
  preco: number;
  prazoDiasUteis: number;
  destaque?: boolean;
};

export const PACOTES: Pacote[] = [
  {
    id: "largada",
    nome: "Largada",
    paraQuem: "Pra começar a aparecer no Instagram",
    itens: { anuncio: 1, reel: 2, carrossel: 2, post: 2, story: 2 },
    preco: 247,
    prazoDiasUteis: 3,
  },
  {
    id: "acelera",
    nome: "Acelera",
    paraQuem: "Pra postar com frequência e anunciar",
    itens: { anuncio: 2, reel: 4, carrossel: 5, post: 4, story: 5 },
    preco: 497,
    prazoDiasUteis: 5,
  },
  {
    id: "turbo",
    nome: "Turbo",
    paraQuem: "Pra dominar o mês inteiro",
    itens: { anuncio: 4, reel: 8, carrossel: 10, post: 10, story: 10 },
    preco: 997,
    prazoDiasUteis: 10,
    destaque: true,
  },
];

// Vendidos à parte (avulso). O anúncio avulso vem com 1 vídeo + 1 post de imagem pra anunciar.
export const AVULSOS = [
  { id: "anuncio", nome: "Anúncio avulso", desc: "1 vídeo + 1 post de imagem, focados em anúncio", preco: 150 },
  { id: "identidade", nome: "Identidade visual", desc: "Logo, cores e fontes da sua marca, pra quem ainda não tem", preco: 100 },
  { id: "pagina", nome: "Página de vendas", desc: "Uma página pra apresentar a oferta e levar ao WhatsApp", preco: 200 },
] as const;

export const DETALHES = {
  duracaoVideo: "até 30 segundos",
  slidesCarrossel: "até 8 slides",
  ajustesPorPeca: 1,
};

// Número no formato internacional, só dígitos (ex.: 5571999999999). Vazio = ainda não configurado.
export const WHATSAPP = "";

export function pecas(p: Pacote) {
  return TIPOS.reduce((s, t) => s + p.itens[t.id], 0);
}

// Vídeos (anúncios + reels), usados nos contadores da área do cliente.
export function videos(p: Pacote) {
  return p.itens.anuncio + p.itens.reel;
}

export function precoPorPeca(p: Pacote) {
  return p.preco / pecas(p);
}

// Quanto custaria a mesma quantidade de peças pelo preço por peça do Largada.
export function economia(p: Pacote) {
  const base = PACOTES[0];
  return Math.max(0, Math.round(pecas(p) * precoPorPeca(base) - p.preco));
}

// "1 anúncio · 2 reels · 2 carrosséis · ..." (só os tipos com quantidade > 0)
export function resumo(p: Pacote, sep = " · ") {
  return TIPOS.filter((t) => p.itens[t.id] > 0)
    .map((t) => `${p.itens[t.id]} ${p.itens[t.id] === 1 ? t.um : t.varios}`)
    .join(sep);
}

export function linkWhatsApp(texto: string) {
  return WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}` : null;
}

// R$ 150 em vez de R$ 150,00 quando o valor é redondo.
export function reais(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
  });
}
