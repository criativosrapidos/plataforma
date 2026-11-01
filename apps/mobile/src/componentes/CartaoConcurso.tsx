import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Check, Plus } from "lucide-react-native";
import { brl, DATE_TIPO_LABEL, dataCurtaBR, numeroBR, type ConcursoResumoDTO } from "@aviso/shared";
import { contagemTexto, etiquetaConcurso, hojeLocal } from "@/lib/formato";
import { cores } from "@/tema";
import { useAcoesConcurso } from "./acoesConcurso";
import { Botao } from "./Botao";
import { Card } from "./Card";
import { Etiqueta } from "./Etiqueta";
import { Texto } from "./Texto";

export function nomeCurto(c: Pick<ConcursoResumoDTO, "orgao_sigla" | "orgao">) {
  return c.orgao_sigla ?? c.orgao;
}

export function localConcurso(c: Pick<ConcursoResumoDTO, "esfera" | "uf" | "cidade">) {
  if (c.esfera === "federal" && !c.uf) return "Nacional";
  if (c.cidade && c.uf) return `${c.cidade}/${c.uf}`;
  return c.uf ?? "Nacional";
}

/** Linha de fatos: "65 vagas + CR · até R$ 14.200,00 · FCC" */
export function fatosConcurso(c: ConcursoResumoDTO) {
  const partes: string[] = [];
  if (c.vagas_total)
    partes.push(`${numeroBR(c.vagas_total)} ${c.vagas_total === 1 ? "vaga" : "vagas"}${c.cadastro_reserva ? " + CR" : ""}`);
  else if (c.cadastro_reserva) partes.push("cadastro reserva");
  if (c.salario_max_centavos) partes.push(`até ${brl(c.salario_max_centavos)}`);
  partes.push(c.banca ?? "banca a definir");
  return partes.join(" · ");
}

export function CartaoConcurso({ c, motivo }: { c: ConcursoResumoDTO; motivo?: string }) {
  const { acompanhar, deixar } = useAcoesConcurso();
  const hoje = hojeLocal();
  const et = etiquetaConcurso(c, hoje);
  const prox = c.proxima_data;
  return (
    <Card
      onPress={() => router.push(`/concurso/${c.id}`)}
      rotuloAcessivel={`${c.titulo}. ${fatosConcurso(c)}`}
      testID={`concurso-${c.slug}`}
    >
      <View style={s.linha}>
        <Etiqueta texto={et.texto} tom={et.tom} />
        <Texto variante="rotulo" cor={cores.tx2} style={{ fontSize: 10.5 }}>
          {localConcurso(c)}
        </Texto>
      </View>
      <Texto variante="h3">{c.titulo}</Texto>
      <Texto variante="mono" cor={cores.tx2} style={{ fontSize: 12.5 }}>
        {fatosConcurso(c)}
      </Texto>
      {prox ? (
        <Texto variante="meta">
          {DATE_TIPO_LABEL[prox.tipo]} até {dataCurtaBR(prox.data)} · {contagemTexto(prox.data, hoje)}
        </Texto>
      ) : null}
      <View style={[s.linha, { marginTop: 4 }]}>
        <Texto variante="pequeno" style={{ flex: 1 }} numberOfLines={2}>
          {motivo ?? (c.exemplo ? "Dados de exemplo" : c.orgao)}
        </Texto>
        {c.acompanhando ? (
          <Botao
            titulo="Acompanhando"
            icone={Check}
            variante="sucesso"
            tamanho="p"
            onPress={() => deixar(c.id, nomeCurto(c))}
            rotuloAcessivel={`Acompanhando ${nomeCurto(c)}. Toque para deixar de acompanhar`}
          />
        ) : (
          <Botao
            titulo="Acompanhar"
            icone={Plus}
            tamanho="p"
            onPress={() => acompanhar(c.id, nomeCurto(c))}
            rotuloAcessivel={`Acompanhar ${nomeCurto(c)}`}
            testID={`acompanhar-${c.slug}`}
          />
        )}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
});
