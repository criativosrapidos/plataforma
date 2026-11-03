import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcularAcesso, canaisPermitidos, casarPerfil, materiasEmComum, lembretesDoDia, emHorarioSilencioso,
  diffCampos, chaveDedup, contagem, brl, dataBR, temRecurso,
} from "@aviso/shared";

const agora = new Date("2026-11-01T12:00:00Z");
const dias = (n: number) => new Date(agora.getTime() + n * 86_400_000);

test("sem assinatura não libera (sem plano grátis)", () => {
  const a = calcularAcesso(null, agora);
  assert.equal(a.liberado, false);
  assert.equal(a.motivoBloqueio, "sem_assinatura");
});

test("teste de 3 dias libera e conta dias; vencido bloqueia", () => {
  const t = calcularAcesso({ plano: "aviso", status: "trial", trial_ends_at: dias(3), current_period_end: dias(3) }, agora);
  assert.equal(t.liberado, true);
  assert.equal(t.emTeste, true);
  assert.equal(t.diasRestantesTeste, 3);
  const v = calcularAcesso({ plano: "aviso", status: "trial", trial_ends_at: dias(-1), current_period_end: dias(-1) }, agora);
  assert.equal(v.liberado, false);
  assert.equal(v.motivoBloqueio, "teste_acabou");
});

test("inadimplente tem 3 dias de tolerância", () => {
  const s = (n: number) => ({ plano: "aviso" as const, status: "inadimplente" as const, trial_ends_at: null, current_period_end: dias(n) });
  assert.equal(calcularAcesso(s(-2), agora).liberado, true);
  assert.equal(calcularAcesso(s(-4), agora).liberado, false);
});

test("cancelada usa até o fim do período", () => {
  const s = (n: number) => ({ plano: "aprovado" as const, status: "cancelada" as const, trial_ends_at: null, current_period_end: dias(n) });
  assert.equal(calcularAcesso(s(10), agora).liberado, true);
  assert.equal(calcularAcesso(s(-1), agora).liberado, false);
});

test("recursos do Aprovado não existem no Aviso", () => {
  const aviso = calcularAcesso({ plano: "aviso", status: "ativa", trial_ends_at: null, current_period_end: dias(20) }, agora);
  const aprov = calcularAcesso({ plano: "aprovado", status: "ativa", trial_ends_at: null, current_period_end: dias(20) }, agora);
  for (const r of ["whatsapp", "pergunte_edital", "radar", "convocacao_nominal"] as const) {
    assert.equal(temRecurso(aviso, r), false, r);
    assert.equal(temRecurso(aprov, r), true, r);
  }
});

test("WhatsApp: só Aprovado, só véspera, só prazo, até 10 no mês, com opt-in", () => {
  const aprov = calcularAcesso({ plano: "aprovado", status: "ativa", trial_ends_at: null, current_period_end: dias(20) }, agora);
  const aviso = calcularAcesso({ plano: "aviso", status: "ativa", trial_ends_at: null, current_period_end: dias(20) }, agora);
  const base = { pushOn: true, whatsappOn: true, whatsappOptin: true, whatsappEnviadosNoMes: 0, diasAteFim: 1 };
  assert.ok(canaisPermitidos({ ...base, acesso: aprov, tipo: "inscricao_acabando" }).includes("whatsapp"));
  assert.ok(!canaisPermitidos({ ...base, acesso: aviso, tipo: "inscricao_acabando" }).includes("whatsapp"));
  assert.ok(!canaisPermitidos({ ...base, acesso: aprov, tipo: "inscricao_acabando", diasAteFim: 3 }).includes("whatsapp"));
  assert.ok(!canaisPermitidos({ ...base, acesso: aprov, tipo: "edital_publicado" }).includes("whatsapp"));
  assert.ok(!canaisPermitidos({ ...base, acesso: aprov, tipo: "isencao_acabando", whatsappEnviadosNoMes: 10 }).includes("whatsapp"));
  assert.ok(!canaisPermitidos({ ...base, acesso: aprov, tipo: "isencao_acabando", whatsappOptin: false }).includes("whatsapp"));
});

test("sem acesso não recebe aviso de concurso; radar só Aprovado", () => {
  const sem = calcularAcesso(null, agora);
  const aviso = calcularAcesso({ plano: "aviso", status: "ativa", trial_ends_at: null, current_period_end: dias(20) }, agora);
  const base = { pushOn: true, whatsappOn: false, whatsappOptin: false, whatsappEnviadosNoMes: 0 };
  assert.deepEqual(canaisPermitidos({ ...base, acesso: sem, tipo: "edital_publicado" }), []);
  assert.deepEqual(canaisPermitidos({ ...base, acesso: aviso, tipo: "autorizado" }), []);
  assert.deepEqual(canaisPermitidos({ ...base, acesso: aviso, tipo: "edital_publicado" }), ["inapp", "push"]);
});

const concurso = {
  orgao: "Tribunal Regional Federal da 3ª Região", esfera: "federal" as const, uf: "SP", banca: "FCC",
  escolaridades: ["medio", "superior"], areas: ["tribunais"], salario_max_centavos: 1420000, titulo: "TRF 3", resumo: null,
  cargos: [{ nome: "Técnico Judiciário", escolaridade: "medio", salario_centavos: 870000 }],
};
const perfilVazio = { escolaridades: [], areas: [], cargos: [], ufs: [], incluir_nacional: true, salario_min_centavos: null, bancas: [], palavras_chave: [] };

test("casar perfil: filtros vazios casam; cada filtro restringe", () => {
  assert.equal(casarPerfil(perfilVazio, concurso).casa, true);
  assert.equal(casarPerfil({ ...perfilVazio, ufs: ["RJ"] }, concurso).casa, false);
  assert.equal(casarPerfil({ ...perfilVazio, ufs: ["SP"] }, concurso).casa, true);
  assert.equal(casarPerfil({ ...perfilVazio, escolaridades: ["fundamental"] }, concurso).casa, false);
  assert.equal(casarPerfil({ ...perfilVazio, salario_min_centavos: 2000000 }, concurso).casa, false);
  assert.equal(casarPerfil({ ...perfilVazio, bancas: ["fcc"] }, concurso).casa, true);
  assert.equal(casarPerfil({ ...perfilVazio, palavras_chave: ["tecnico judiciario"] }, concurso).casa, true);
  assert.equal(casarPerfil({ ...perfilVazio, palavras_chave: ["auditor"] }, concurso).casa, false);
  assert.equal(casarPerfil({ ...perfilVazio, ativo: false }, concurso).casa, false);
});

test("federal sem UF passa com 'incluir nacionais'", () => {
  const inss = { ...concurso, uf: null };
  assert.equal(casarPerfil({ ...perfilVazio, ufs: ["BA"] }, inss).casa, true);
  assert.equal(casarPerfil({ ...perfilVazio, ufs: ["BA"], incluir_nacional: false }, inss).casa, false);
});

test("matérias em comum: ordena por concursos e depois questões, respeita desligados", () => {
  const itens = [
    { contest_id: "a", subject_id: "pt", subject_nome: "Língua Portuguesa", questoes: 10 },
    { contest_id: "b", subject_id: "pt", subject_nome: "Língua Portuguesa", questoes: 20 },
    { contest_id: "c", subject_id: "pt", subject_nome: "Língua Portuguesa", questoes: 5 },
    { contest_id: "a", subject_id: "dc", subject_nome: "Direito Constitucional", questoes: 10 },
    { contest_id: "b", subject_id: "dc", subject_nome: "Direito Constitucional", questoes: 10 },
    { contest_id: "a", subject_id: "rl", subject_nome: "Raciocínio Lógico", questoes: 5 },
    { contest_id: "c", subject_id: "rl", subject_nome: "Raciocínio Lógico", questoes: 30 },
  ];
  const r = materiasEmComum(itens);
  assert.deepEqual(r.map((m) => m.subject_id), ["pt", "rl", "dc"]);
  assert.equal(r[0].questoesTotal, 35);
  const semC = materiasEmComum(itens, new Set(["a", "b"]));
  assert.deepEqual(semC.map((m) => m.subject_id), ["pt", "dc", "rl"]);
});

test("lembretes: antecedência e véspera; prova amanhã", () => {
  const hoje = "2026-11-01";
  assert.deepEqual(lembretesDoDia({ tipo: "inscricao", inicio: "2026-10-01", fim: "2026-11-04" }, hoje, 3), [{ tipo: "inscricao_acabando", diasAteFim: 3 }]);
  assert.deepEqual(lembretesDoDia({ tipo: "isencao", inicio: null, fim: "2026-11-02" }, hoje, 3), [{ tipo: "isencao_acabando", diasAteFim: 1 }]);
  assert.deepEqual(lembretesDoDia({ tipo: "inscricao", inicio: null, fim: "2026-11-03" }, hoje, 3), []);
  assert.deepEqual(lembretesDoDia({ tipo: "prova", inicio: "2026-11-02", fim: "2026-11-02" }, hoje, 3), [{ tipo: "prova_amanha", diasAteFim: 1 }]);
});

test("lembretes: prova de 2 dias avisa na véspera do 1º dia; prazo só com início não está 'acabando'", () => {
  assert.deepEqual(lembretesDoDia({ tipo: "prova", inicio: "2026-11-10", fim: "2026-11-11" }, "2026-11-09", 3), [{ tipo: "prova_amanha", diasAteFim: 1 }]);
  assert.deepEqual(lembretesDoDia({ tipo: "prova", inicio: "2026-11-10", fim: "2026-11-11" }, "2026-11-10", 3), []);
  assert.deepEqual(lembretesDoDia({ tipo: "inscricao", inicio: "2026-11-10", fim: null }, "2026-11-09", 3), []);
});

test("assinatura 'ativa' sem fim de período não libera acesso", () => {
  assert.equal(calcularAcesso({ plano: "aprovado", status: "ativa", trial_ends_at: null, current_period_end: null }, agora).liberado, false);
});

test("horário silencioso atravessa a meia-noite", () => {
  assert.equal(emHorarioSilencioso("23:30", "22:00", "07:00"), true);
  assert.equal(emHorarioSilencioso("06:59", "22:00", "07:00"), true);
  assert.equal(emHorarioSilencioso("07:00", "22:00", "07:00"), false);
  assert.equal(emHorarioSilencioso("13:00", "12:00", "14:00"), true);
  assert.equal(emHorarioSilencioso("13:00", null, null), false);
});

test("diff de errata ignora campos não informados", () => {
  const d = diffCampos({ prova: "2026-12-01", taxa: 8500 }, { prova: "2026-12-08" });
  assert.deepEqual(d, [{ campo: "prova", antes: "2026-12-01", depois: "2026-12-08" }]);
});

test("chave de dedup normaliza órgão, número e zeros à esquerda", () => {
  assert.equal(chaveDedup("Tribunal Regional Federal da 3ª Região", "01/2026", 2026), chaveDedup("TRIBUNAL REGIONAL FEDERAL DA 3ª REGIÃO", " 1/2026", 2026));
});

test("formatação pt-BR", () => {
  assert.equal(brl(850000).replace(/\s/g, " "), "R$ 8.500,00");
  assert.equal(dataBR("2026-11-03"), "03/11/2026");
  assert.equal(contagem("2026-11-02", "2026-11-01"), "amanhã");
  assert.equal(contagem("2026-11-13", "2026-11-01"), "faltam 12 dias");
});
