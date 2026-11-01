"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import {
  AREAS, AREA_LABEL, BANCAS, ESCOLARIDADES, ESCOLARIDADE_LABEL, UFS, brl,
  type Area, type Escolaridade, type PerfilDTO,
} from "@aviso/shared";
import { api, useEnvio } from "@/components/ui/api-cliente";
import { Campo, Chip, Interruptor } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Aviso";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import { Dialogo } from "@/components/ui/Dialogo";
import { Vazio } from "./Blocos";

type Entrada = Omit<PerfilDTO, "id">;

const VAZIO: Entrada = {
  nome: "",
  escolaridades: [],
  areas: [],
  cargos: [],
  ufs: [],
  incluir_nacional: true,
  salario_min_centavos: null,
  bancas: [],
  palavras_chave: [],
  ativo: true,
};

const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

/** Campo de etiquetas livres (cargos, palavras-chave, bancas fora da lista). */
function CampoEtiquetas({
  rotulo,
  dica,
  valores,
  aoMudar,
  erro,
  placeholder,
}: {
  rotulo: string;
  dica?: string;
  valores: string[];
  aoMudar: (v: string[]) => void;
  erro?: string;
  placeholder?: string;
}) {
  const id = useId();
  const [texto, setTexto] = useState("");
  function adicionar() {
    const novos = texto
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter((t) => t && t.length <= 80 && !valores.some((v) => v.toLowerCase() === t.toLowerCase()));
    if (novos.length) aoMudar([...valores, ...novos].slice(0, 30));
    setTexto("");
  }
  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      adicionar();
    } else if (e.key === "Backspace" && !texto && valores.length) {
      aoMudar(valores.slice(0, -1));
    }
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {rotulo}
      </label>
      {valores.length ? (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label={`${rotulo} adicionados`}>
          {valores.map((v) => (
            <li key={v} className="inline-flex items-center gap-1 rounded-full bg-azul-t py-1 pr-1 pl-3 text-[14px] font-semibold text-azul-2">
              {v}
              <button
                type="button"
                onClick={() => aoMudar(valores.filter((x) => x !== v))}
                className="grid size-8 place-items-center rounded-full hover:bg-white/70"
                aria-label={`Remover ${v}`}
              >
                <Icone nome="fechar" tamanho={14} strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <input
          id={id}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={aoTeclar}
          onBlur={() => texto.trim() && adicionar()}
          placeholder={placeholder}
          aria-describedby={dica ? `${id}-dica` : undefined}
          aria-invalid={erro ? true : undefined}
          className={clsx(
            "min-h-12 w-full min-w-0 rounded-xl border-[1.5px] bg-branco px-4 py-3 text-base outline-none placeholder:text-[#8A90A6] focus:border-azul focus:ring-4 focus:ring-azul/15",
            erro ? "border-verm" : "border-linha",
          )}
        />
        <Botao variante="secundario" onClick={adicionar} disabled={!texto.trim()} className="shrink-0" icone="mais">
          <span className="sr-only sm:not-sr-only">Adicionar</span>
        </Botao>
      </div>
      {erro ? (
        <p className="mt-1.5 text-sm font-semibold text-[#A8232A]">{erro}</p>
      ) : dica ? (
        <p id={`${id}-dica`} className="mt-1.5 text-sm text-tx2">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

function Grupo({ titulo, dica, children, acao }: { titulo: string; dica?: string; children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <legend className="text-sm font-bold">{titulo}</legend>
        {acao}
      </div>
      {dica ? <p className="-mt-1 mb-2.5 text-sm text-tx2">{dica}</p> : null}
      {children}
    </fieldset>
  );
}

function reaisParaCentavos(texto: string): number | null {
  const d = texto.replace(/\D/g, "");
  if (!d) return null;
  return Math.min(100_000_00, Number(d) * 100);
}

function EditorPerfil({
  inicial,
  aoTerminar,
  aoCancelar,
}: {
  inicial: PerfilDTO | null;
  aoTerminar: (msg: string, perfil: PerfilDTO) => void;
  aoCancelar: () => void;
}) {
  const [p, setP] = useState<Entrada>(inicial ? { ...inicial } : { ...VAZIO });
  const [salario, setSalario] = useState(inicial?.salario_min_centavos ? String(Math.floor(inicial.salario_min_centavos / 100)) : "");
  const { enviando, erro, campos, enviar, validar } = useEnvio();
  const titulo = useRef<HTMLHeadingElement>(null);
  const set = <K extends keyof Entrada>(k: K, v: Entrada[K]) => setP((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (validar({ nome: !p.nome.trim() && "Dê um nome ao perfil, como “Tribunais em SP”" })) return;
    const corpo: Entrada = { ...p, nome: p.nome.trim(), salario_min_centavos: reaisParaCentavos(salario) };
    const r = await enviar(() =>
      inicial
        ? api<PerfilDTO>(`/api/v1/perfis/${inicial.id}`, { metodo: "PUT", corpo })
        : api<PerfilDTO>("/api/v1/perfis", { metodo: "POST", corpo }),
    );
    if (r) aoTerminar(inicial ? `Perfil “${r.nome}” atualizado.` : `Perfil “${r.nome}” criado. A gente avisa quando sair concurso que combina.`, r);
  }

  const erroLista = (k: string) => Object.entries(campos).find(([c]) => c === k || c.startsWith(`${k}.`))?.[1];

  return (
    <form onSubmit={salvar} noValidate className="rounded-[24px] border-2 border-azul bg-branco p-5 shadow-[0_24px_50px_-30px_rgb(31_63_209/0.5)] sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <h2 ref={titulo} tabIndex={-1} className="font-sans text-xl font-extrabold tracking-normal normal-case outline-none">
          {inicial ? "Editar perfil" : "Novo perfil de busca"}
        </h2>
        <button type="button" onClick={aoCancelar} className="-mt-2 -mr-2 grid size-11 place-items-center rounded-full text-tx2 hover:bg-papel" aria-label="Fechar">
          <Icone nome="fechar" tamanho={20} />
        </button>
      </div>
      <p className="mt-1 text-[15px] text-tx2">Deixe em branco o que tanto faz: filtro vazio não restringe. Concurso precisa bater com todos os filtros preenchidos.</p>

      <div className="mt-6 grid gap-7">
        <Campo rotulo="Nome do perfil" value={p.nome} onChange={(e) => set("nome", e.target.value)} maxLength={60} placeholder="Ex.: Tribunais em SP" erro={campos.nome} />

        <Grupo titulo="Escolaridade">
          <div className="flex flex-wrap gap-2">
            {ESCOLARIDADES.map((e) => (
              <Chip key={e} ativo={p.escolaridades.includes(e)} onClick={() => set("escolaridades", alternar(p.escolaridades, e))}>
                {ESCOLARIDADE_LABEL[e]}
              </Chip>
            ))}
          </div>
        </Grupo>

        <Grupo titulo="Áreas">
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <Chip key={a} ativo={p.areas.includes(a)} onClick={() => set("areas", alternar(p.areas, a))}>
                {AREA_LABEL[a]}
              </Chip>
            ))}
          </div>
        </Grupo>

        <Grupo
          titulo="Estados"
          dica="Sem estado marcado, vale o Brasil todo."
          acao={
            <span className="flex gap-1">
              <button type="button" className="min-h-11 rounded-full px-3 text-sm font-bold text-azul hover:bg-azul-t" onClick={() => set("ufs", [...UFS])}>
                Todos
              </button>
              <button type="button" className="min-h-11 rounded-full px-3 text-sm font-bold text-azul hover:bg-azul-t" onClick={() => set("ufs", [])}>
                Limpar
              </button>
            </span>
          }
        >
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 lg:grid-cols-9">
            {UFS.map((u) => {
              const on = p.ufs.includes(u);
              return (
                <button
                  key={u}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("ufs", alternar(p.ufs, u))}
                  className={clsx(
                    "min-h-11 rounded-xl border-[1.5px] font-mono text-[14px] font-bold transition-colors",
                    on ? "border-azul bg-azul text-white" : "border-linha bg-branco hover:border-tinta",
                  )}
                >
                  {u}
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl bg-papel p-4">
            <Interruptor
              ligado={p.incluir_nacional}
              aoMudar={(v) => set("incluir_nacional", v)}
              rotulo="Incluir concursos nacionais"
              descricao="Concursos federais com vagas para todo o Brasil, como INSS e Banco do Brasil."
            />
          </div>
        </Grupo>

        <div className="grid gap-7 md:grid-cols-2">
          <div>
            <label htmlFor="perfil-salario" className="mb-1.5 block text-sm font-bold">
              Salário mínimo <span className="font-medium text-tx2">(opcional)</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 my-auto h-fit font-mono font-bold text-tx2">R$</span>
              <input
                id="perfil-salario"
                inputMode="numeric"
                value={salario ? Number(salario.replace(/\D/g, "") || 0).toLocaleString("pt-BR") : ""}
                onChange={(e) => setSalario(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Sem mínimo"
                aria-describedby="perfil-salario-dica"
                aria-invalid={campos.salario_min_centavos ? true : undefined}
                className="min-h-12 w-full rounded-xl border-[1.5px] border-linha bg-branco py-3 pr-4 pl-12 font-mono text-base outline-none focus:border-azul focus:ring-4 focus:ring-azul/15"
              />
            </div>
            <p id="perfil-salario-dica" className="mt-1.5 text-sm text-tx2">
              {campos.salario_min_centavos ?? "Concurso sem salário informado também passa."}
            </p>
          </div>
          <CampoEtiquetas
            rotulo="Cargos"
            valores={p.cargos}
            aoMudar={(v) => set("cargos", v)}
            placeholder="Ex.: técnico judiciário"
            dica="Aperte Enter para adicionar cada um."
            erro={erroLista("cargos")}
          />
        </div>

        <Grupo titulo="Bancas" dica="Concurso sem banca definida (previsto ou autorizado) também passa.">
          <div className="flex flex-wrap gap-2">
            {BANCAS.map((b) => (
              <Chip key={b} ativo={p.bancas.includes(b)} onClick={() => set("bancas", alternar(p.bancas, b))}>
                {b}
              </Chip>
            ))}
          </div>
        </Grupo>

        <CampoEtiquetas
          rotulo="Palavras-chave"
          valores={p.palavras_chave}
          aoMudar={(v) => set("palavras_chave", v)}
          placeholder="Ex.: auditor, Petrobras, enfermagem"
          dica="Procuramos no órgão, no título, no resumo e nos cargos."
          erro={erroLista("palavras_chave")}
        />

        <div className="rounded-2xl bg-papel p-4">
          <Interruptor
            ligado={p.ativo}
            aoMudar={(v) => set("ativo", v)}
            rotulo="Perfil ativo"
            descricao="Desligado, o perfil fica salvo mas não gera avisos."
          />
        </div>
      </div>

      {erro ? (
        <Aviso tom="erro" className="mt-6">
          {erro}
        </Aviso>
      ) : null}
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-linha pt-6 sm:flex-row sm:justify-end">
        <Botao variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={enviando}>
          {enviando ? "Salvando..." : inicial ? "Salvar alterações" : "Criar perfil"}
        </Botao>
      </div>
    </form>
  );
}

function Resumo({ p }: { p: PerfilDTO }) {
  const linhas: [string, string][] = [];
  if (p.escolaridades.length) linhas.push(["Escolaridade", p.escolaridades.map((e) => ESCOLARIDADE_LABEL[e as Escolaridade]).join(", ")]);
  if (p.areas.length) linhas.push(["Áreas", p.areas.map((a) => AREA_LABEL[a as Area] ?? a).join(", ")]);
  linhas.push(["Estados", p.ufs.length ? (p.ufs.length === UFS.length ? "Todos" : p.ufs.join(", ")) + (p.incluir_nacional ? " + nacionais" : "") : "Brasil todo"]);
  if (p.salario_min_centavos) linhas.push(["Salário", `a partir de ${brl(p.salario_min_centavos)}`]);
  if (p.bancas.length) linhas.push(["Bancas", p.bancas.join(", ")]);
  if (p.cargos.length) linhas.push(["Cargos", p.cargos.join(", ")]);
  if (p.palavras_chave.length) linhas.push(["Palavras", p.palavras_chave.join(", ")]);
  return (
    <dl className="mt-4 grid gap-x-4 gap-y-1.5 text-[15px] sm:grid-cols-[110px_1fr]">
      {linhas.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="pt-0.5 font-mono text-[11px] font-bold tracking-[0.12em] text-tx2 uppercase">{k}</dt>
          <dd className="mb-1.5 font-semibold sm:mb-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function GerenciarPerfis({ perfis, combinam, abrirNovo }: { perfis: PerfilDTO[]; combinam: Record<string, number>; abrirNovo?: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<PerfilDTO | "novo" | null>(abrirNovo || perfis.length === 0 ? "novo" : null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [excluir, setExcluir] = useState<PerfilDTO | null>(null);
  const [pendente, iniciar] = useTransition();
  const remocao = useEnvio();
  const pausa = useEnvio();

  // Lista local: muda na hora com a resposta da API; o refresh do servidor só atualiza as contagens.
  const [lista, setLista] = useState(perfis);
  const [perfisAnteriores, setPerfisAnteriores] = useState(perfis);
  if (perfis !== perfisAnteriores) {
    setPerfisAnteriores(perfis);
    setLista(perfis);
  }

  function terminar(msg: string, perfil?: PerfilDTO, removido?: string) {
    setEditando(null);
    setMensagem(msg);
    setLista((l) =>
      removido
        ? l.filter((x) => x.id !== removido)
        : perfil
          ? l.some((x) => x.id === perfil.id)
            ? l.map((x) => (x.id === perfil.id ? perfil : x))
            : [...l, perfil]
          : l,
    );
    iniciar(() => router.refresh());
  }

  async function alternarAtivo(p: PerfilDTO) {
    const corpo: Entrada = { ...p, ativo: !p.ativo };
    delete (corpo as Partial<PerfilDTO>).id;
    const r = await pausa.enviar(() => api<PerfilDTO>(`/api/v1/perfis/${p.id}`, { metodo: "PUT", corpo }));
    if (r) terminar(r.ativo ? `Perfil “${r.nome}” ativado.` : `Perfil “${r.nome}” pausado. Ele não gera avisos até você ativar de novo.`, r);
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    const { nome, id } = excluir;
    const r = await remocao.enviar(() => api(`/api/v1/perfis/${id}`, { metodo: "DELETE" }));
    if (r) {
      setExcluir(null);
      terminar(`Perfil “${nome}” excluído.`, undefined, id);
    }
  }

  return (
    <div className="grid gap-5" aria-busy={pendente || undefined}>
      <div aria-live="polite">{mensagem ? <Aviso tom="sucesso">{mensagem}</Aviso> : null}</div>
      {pausa.erro ? <Aviso tom="erro">{pausa.erro}</Aviso> : null}

      {editando ? (
        <EditorPerfil
          key={editando === "novo" ? "novo" : editando.id}
          inicial={editando === "novo" ? null : editando}
          aoTerminar={terminar}
          aoCancelar={() => setEditando(null)}
        />
      ) : (
        <div>
          <Botao icone="mais" onClick={() => { setMensagem(null); setEditando("novo"); }}>
            Novo perfil
          </Botao>
        </div>
      )}

      {lista.length ? (
        <ul className={clsx("grid gap-4", pendente && "opacity-70 transition-opacity")}>
          {lista.map((p) => (
            <li key={p.id} className={clsx("rounded-[24px] border bg-branco p-5 sm:p-6", p.ativo ? "border-linha" : "border-dashed border-[#C7CBD6]")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-sans text-xl font-extrabold tracking-normal normal-case">{p.nome}</h2>
                    <Etiqueta tom={p.ativo ? "verde" : "cinza"}>{p.ativo ? "Ativo" : "Pausado"}</Etiqueta>
                  </div>
                  {p.ativo && combinam[p.id] === undefined ? (
                    <p className="mt-1 text-[15px] text-tx2">Contando os concursos que combinam...</p>
                  ) : p.ativo ? (
                    <p className="mt-1 text-[15px] text-tx2">
                      <strong className="text-tinta">{combinam[p.id]}</strong>{" "}
                      {combinam[p.id] === 1 ? "concurso aberto ou previsto combina" : "concursos abertos ou previstos combinam"} agora
                    </p>
                  ) : (
                    <p className="mt-1 text-[15px] text-tx2">Não gera avisos enquanto estiver pausado.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Botao variante="fantasma" tamanho="sm" icone="lapis" onClick={() => { setMensagem(null); setEditando(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    Editar
                  </Botao>
                  <Botao variante="fantasma" tamanho="sm" onClick={() => alternarAtivo(p)} disabled={pausa.enviando}>
                    {p.ativo ? "Pausar" : "Ativar"}
                  </Botao>
                  <Botao variante="fantasma" tamanho="sm" icone="lixeira" className="!text-[#A8232A]" onClick={() => setExcluir(p)}>
                    Excluir
                  </Botao>
                </div>
              </div>
              <Resumo p={p} />
            </li>
          ))}
        </ul>
      ) : !editando ? (
        <Vazio
          icone={<Icone nome="filtro" tamanho={24} />}
          titulo="Nenhum perfil de busca ainda"
          texto="Um perfil diz o que você procura. Sem perfil, a gente não sabe quais editais avisar."
          acao={
            <Botao icone="mais" onClick={() => setEditando("novo")}>
              Criar meu primeiro perfil
            </Botao>
          }
        />
      ) : null}

      <Dialogo
        aberto={!!excluir}
        aoFechar={() => setExcluir(null)}
        titulo="Excluir perfil?"
        acoes={
          <>
            <Botao variante="secundario" onClick={() => setExcluir(null)}>
              Manter
            </Botao>
            <Botao variante="perigo" onClick={confirmarExclusao} carregando={remocao.enviando}>
              Excluir perfil
            </Botao>
          </>
        }
      >
        <p>
          O perfil <strong>{excluir?.nome}</strong> deixa de gerar avisos. Os concursos que você já acompanha continuam na sua agenda.
        </p>
        {remocao.erro ? <Aviso tom="erro" className="mt-4">{remocao.erro}</Aviso> : null}
      </Dialogo>
    </div>
  );
}
