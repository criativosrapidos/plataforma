// "R$ 50" com espaço; centavos só quando não forem zero ("R$ 14,90").
export function reais(centavos: number): string {
  const inteiro = Math.floor(centavos / 100);
  const resto = centavos % 100;
  const milhar = inteiro.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return resto === 0 ? `R$ ${milhar}` : `R$ ${milhar},${String(resto).padStart(2, '0')}`;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const a = partes[0]?.[0] ?? '?';
  const b = partes.length > 1 ? partes[partes.length - 1][0] : (partes[0]?.[1] ?? '');
  return (a + b).toUpperCase();
}

export function haQuanto(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

// Data de hoje no fuso de Brasília, igual a public.hoje() no banco.
export function hoje(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(ate + 'T00:00:00Z') - Date.parse(de + 'T00:00:00Z')) / 86400000);
}

export function frequencia(n: number): string {
  return n === 7 ? 'Todo dia' : `${n}x por semana`;
}
