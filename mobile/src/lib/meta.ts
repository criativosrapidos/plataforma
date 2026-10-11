// Contas sobre uma meta, espelhando as regras do banco (supabase/migrations).
import { diasEntre, hoje } from './formato';
import type { Checkin, Meta } from './tipos';

export function fimDaMeta(m: Meta): string {
  const d = new Date(m.inicio + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + m.semanas * 7 - 1);
  return d.toISOString().slice(0, 10);
}

export function semanaAtual(m: Meta): number {
  return Math.min(m.semanas, Math.max(1, Math.floor(diasEntre(m.inicio, hoje()) / 7) + 1));
}

// Pendente sem resposta do fiscal há mais de 24 horas também vale.
export function checkinValido(c: Checkin): boolean {
  return c.status === 'aprovado' || (c.status === 'pendente' && Date.now() - Date.parse(c.criado_em) > 86400000);
}

export function resumoDaSemana(m: Meta, checkins: Checkin[]) {
  const semana = semanaAtual(m);
  const inicioSemana = new Date(m.inicio + 'T00:00:00Z');
  inicioSemana.setUTCDate(inicioSemana.getUTCDate() + (semana - 1) * 7);
  const ini = inicioSemana.toISOString().slice(0, 10);
  const daSemana = checkins.filter((c) => c.status !== 'recusado' && diasEntre(ini, c.dia) >= 0 && diasEntre(ini, c.dia) < 7);
  const feitos = daSemana.length;
  const fezHoje = checkins.some((c) => c.dia === hoje());
  const diasRestantes = 7 - diasEntre(ini, hoje());
  return { semana, feitos, fezHoje, diasRestantes, faltam: Math.max(0, m.checkins_por_semana - feitos) };
}

export function podeFazerCheckin(m: Meta): boolean {
  const h = hoje();
  return m.status === 'ativa' && h >= m.inicio && h <= fimDaMeta(m);
}
