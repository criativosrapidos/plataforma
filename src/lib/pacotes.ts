// Pacotes de produção de criativos (o que o site vende hoje).
// Prazos, ajustes e duração do vídeo são sugestões: confirmar com os sócios.

export type Pacote = {
  id: "start" | "pro" | "max";
  nome: string;
  paraQuem: string;
  videos: number;
  carrosseis: number;
  preco: number;
  prazoDiasUteis: number;
  destaque?: boolean;
};

export const PACOTES: Pacote[] = [
  { id: "start", nome: "Start", paraQuem: "Pra testar o nosso trabalho", videos: 1, carrosseis: 1, preco: 150, prazoDiasUteis: 3 },
  { id: "pro", nome: "Pro", paraQuem: "Pra postar com frequência", videos: 5, carrosseis: 5, preco: 500, prazoDiasUteis: 7 },
  { id: "max", nome: "Max", paraQuem: "Pra dominar o mês inteiro", videos: 10, carrosseis: 10, preco: 750, prazoDiasUteis: 10, destaque: true },
];

export const DETALHES = {
  duracaoVideo: "até 30 segundos",
  slidesCarrossel: "até 8 slides",
  ajustesPorPeca: 1,
};

// Número no formato internacional, só dígitos (ex.: 5571999999999). Vazio = ainda não configurado.
export const WHATSAPP = "";

export function pecas(p: Pacote) {
  return p.videos + p.carrosseis;
}

export function precoPorPeca(p: Pacote) {
  return p.preco / pecas(p);
}

// Quanto custaria comprando vários Start.
export function economia(p: Pacote) {
  const start = PACOTES[0];
  return Math.max(0, (p.videos / start.videos) * start.preco - p.preco);
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
