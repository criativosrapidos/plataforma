// Peças do perfil de busca: escolaridade, áreas, UFs + nacional, salário mínimo, bancas, cargos e palavras-chave.
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Plus, X } from "lucide-react-native";
import {
  AREA_LABEL,
  AREAS,
  BANCAS,
  brl,
  ESCOLARIDADE_LABEL,
  ESCOLARIDADES,
  UFS,
  type Area,
  type Escolaridade,
  type PerfilDTO,
} from "@aviso/shared";
import type { PerfilEntrada } from "@/api/api";
import { cores, fontes } from "@/tema";
import { Campo } from "./Campo";
import { Chip } from "./Chip";
import { Interruptor } from "./Controles";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

export const PERFIL_VAZIO: PerfilEntrada = {
  nome: "Meu perfil",
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

type Mudar = (p: Partial<PerfilEntrada>) => void;

const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

export function GrupoEscolaridade({ p, mudar }: { p: PerfilEntrada; mudar: Mudar }) {
  return (
    <View style={s.grade}>
      {ESCOLARIDADES.map((e) => (
        <Chip
          key={e}
          rotulo={ESCOLARIDADE_LABEL[e]}
          ativo={p.escolaridades.includes(e)}
          onPress={() => mudar({ escolaridades: alternar<Escolaridade>(p.escolaridades, e) })}
          testID={`esc-${e}`}
        />
      ))}
    </View>
  );
}

export function GrupoAreas({ p, mudar }: { p: PerfilEntrada; mudar: Mudar }) {
  return (
    <View style={s.grade}>
      {AREAS.map((a) => (
        <Chip
          key={a}
          rotulo={a === "ti" ? "TI" : AREA_LABEL[a]}
          ativo={p.areas.includes(a)}
          onPress={() => mudar({ areas: alternar<Area>(p.areas as Area[], a) })}
          testID={`area-${a}`}
        />
      ))}
    </View>
  );
}

export function GrupoUfs({ p, mudar }: { p: PerfilEntrada; mudar: Mudar }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={s.ufs}>
        {UFS.map((uf) => {
          const ativo = p.ufs.includes(uf);
          return (
            <Pressionavel
              key={uf}
              onPress={() => mudar({ ufs: alternar<string>(p.ufs, uf) })}
              haptico="selecao"
              escala={0.92}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={uf}
              style={[s.uf, ativo && s.ufAtivo]}
              testID={`uf-${uf}`}
            >
              <Texto style={[s.ufTexto, ativo && { color: cores.branco }]} maxFontSizeMultiplier={1.2}>
                {uf}
              </Texto>
            </Pressionavel>
          );
        })}
      </View>
      <View style={s.linhaInterruptor}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="corpoForte">Concursos nacionais</Texto>
          <Texto variante="meta">Federais com vagas no país todo (INSS, Receita, BB…)</Texto>
        </View>
        <Interruptor ligado={p.incluir_nacional} aoMudar={(v) => mudar({ incluir_nacional: v })} rotulo="Incluir concursos nacionais" />
      </View>
      <Texto variante="pequeno">
        {p.ufs.length
          ? `${p.ufs.length} ${p.ufs.length === 1 ? "estado" : "estados"} marcados.`
          : "Nenhum estado marcado: vale o Brasil todo."}
      </Texto>
    </View>
  );
}

const SALARIOS = [null, 200_000, 300_000, 500_000, 800_000, 1_200_000];

export function GrupoSalario({ p, mudar }: { p: PerfilEntrada; mudar: Mudar }) {
  return (
    <View style={s.grade}>
      {SALARIOS.map((v) => (
        <Chip
          key={String(v)}
          rotulo={v == null ? "Qualquer salário" : `a partir de ${brl(v).replace(",00", "")}`}
          ativo={p.salario_min_centavos === v}
          onPress={() => mudar({ salario_min_centavos: v })}
          testID={`sal-${v ?? 0}`}
        />
      ))}
    </View>
  );
}

export function GrupoBancas({ p, mudar }: { p: PerfilEntrada; mudar: Mudar }) {
  return (
    <View style={s.grade}>
      {BANCAS.map((b) => (
        <Chip key={b} rotulo={b} ativo={p.bancas.includes(b)} onPress={() => mudar({ bancas: alternar<string>(p.bancas, b) })} />
      ))}
    </View>
  );
}

/** Lista de termos livres (cargos, palavras-chave) com sugestões. */
export function CampoTermos({
  valores,
  mudar,
  sugestoes = [],
  placeholder,
  rotulo,
  testID,
}: {
  valores: string[];
  mudar: (v: string[]) => void;
  sugestoes?: string[];
  placeholder: string;
  rotulo: string;
  testID?: string;
}) {
  const [texto, setTexto] = useState("");
  const adicionar = (t: string) => {
    const v = t.trim();
    if (!v || valores.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    mudar([...valores, v]);
    setTexto("");
  };
  const livres = sugestoes.filter((sug) => !valores.some((x) => x.toLowerCase() === sug.toLowerCase()));
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
        <View style={{ flex: 1 }}>
          <Campo
            rotulo={rotulo}
            value={texto}
            onChangeText={setTexto}
            placeholder={placeholder}
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={() => adicionar(texto)}
            testID={testID}
          />
        </View>
        <Pressionavel
          onPress={() => adicionar(texto)}
          accessibilityLabel={`Adicionar ${rotulo.toLowerCase()}`}
          style={s.mais}
          disabled={!texto.trim()}
        >
          <Plus size={22} color={cores.branco} strokeWidth={2.6} />
        </Pressionavel>
      </View>
      {valores.length ? (
        <View style={s.grade}>
          {valores.map((v) => (
            <Pressionavel
              key={v}
              onPress={() => mudar(valores.filter((x) => x !== v))}
              style={s.termo}
              accessibilityLabel={`Remover ${v}`}
              escala={0.95}
            >
              <Texto style={s.termoTexto}>{v}</Texto>
              <X size={14} color={cores.branco} strokeWidth={3} />
            </Pressionavel>
          ))}
        </View>
      ) : null}
      {livres.length ? (
        <View style={s.grade}>
          {livres.map((sug) => (
            <Chip key={sug} rotulo={sug} icone={Plus} onPress={() => adicionar(sug)} rotuloAcessivel={`Adicionar ${sug}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const SUGESTOES_CARGOS = ["Técnico", "Analista", "Agente", "Escriturário", "Professor", "Auditor", "Policial"];

/** "Médio e superior · tribunais, fiscal · SP, MG e nacionais · a partir de R$ 4.000" */
export function resumoPerfil(p: Omit<PerfilDTO, "id"> | PerfilEntrada): string {
  const juntar = (l: string[]) => (l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} e ${l[l.length - 1]}`);
  const partes: string[] = [];
  if (p.escolaridades.length) {
    const t = juntar(p.escolaridades.map((e) => ESCOLARIDADE_LABEL[e].toLowerCase()));
    partes.push(t.charAt(0).toUpperCase() + t.slice(1));
  }
  if (p.areas.length)
    partes.push(
      p.areas
        .map((a) => (a === "ti" ? "TI" : (AREA_LABEL[a as Area]?.toLowerCase() ?? a)))
        .slice(0, 3)
        .join(", ") + (p.areas.length > 3 ? "…" : ""),
    );
  const locais = [...p.ufs.slice(0, 4), ...(p.ufs.length > 4 ? [`+${p.ufs.length - 4}`] : [])];
  if (p.ufs.length) partes.push(juntar(p.incluir_nacional ? [...locais, "nacionais"] : locais));
  else partes.push("Brasil todo");
  if (p.salario_min_centavos) partes.push(`a partir de ${brl(p.salario_min_centavos).replace(",00", "")}`);
  if (p.bancas.length) partes.push(p.bancas.slice(0, 3).join(", "));
  const termos = [...p.cargos, ...p.palavras_chave];
  if (termos.length) partes.push(`“${termos.slice(0, 3).join("”, “")}”`);
  return partes.join(" · ");
}

const s = StyleSheet.create({
  grade: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ufs: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  uf: {
    width: "12.8%",
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
  },
  ufAtivo: { backgroundColor: cores.azul, borderColor: cores.azul },
  ufTexto: { fontFamily: fontes.monoNegrito, fontSize: 13.5, color: cores.tinta },
  linhaInterruptor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.linha,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  mais: { width: 50, height: 50, borderRadius: 14, backgroundColor: cores.azul, alignItems: "center", justifyContent: "center" },
  termo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: cores.tinta,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  termoTexto: { fontFamily: fontes.negrito, fontSize: 13, color: cores.branco },
});
