import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  AlarmClock,
  BadgeCheck,
  CircleCheckBig,
  ExternalLink,
  FilePenLine,
  Landmark,
  ListChecks,
  MapPin,
  Megaphone,
  PencilLine,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import { ALERT_TIPO_LABEL, type AlertTipo, type AvisoDTO } from "@aviso/shared";
import { useMarcarLidos } from "@/api/consultas";
import { quando, type TomEtiqueta } from "@/lib/formato";
import { abrirLink } from "@/lib/links";
import { cores } from "@/tema";
import { Card } from "./Card";
import { Etiqueta } from "./Etiqueta";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

const TOM: Record<AlertTipo, TomEtiqueta> = {
  edital_publicado: "aberto",
  autorizado: "info",
  isencao_acabando: "encerra",
  inscricao_acabando: "encerra",
  errata: "errata",
  local_prova: "info",
  prova_amanha: "encerra",
  gabarito: "info",
  resultado: "info",
  convocacao: "marca",
  cobranca_amanha: "neutro",
};

const ICONE: Record<AlertTipo, LucideIcon> = {
  edital_publicado: Megaphone,
  autorizado: BadgeCheck,
  isencao_acabando: AlarmClock,
  inscricao_acabando: AlarmClock,
  errata: FilePenLine,
  local_prova: MapPin,
  prova_amanha: PencilLine,
  gabarito: ListChecks,
  resultado: CircleCheckBig,
  convocacao: Landmark,
  cobranca_amanha: Wallet,
};

const COR_ICONE: Record<TomEtiqueta, string> = {
  aberto: cores.verdeTexto,
  encerra: cores.vermTexto,
  errata: cores.ambar,
  info: cores.azul,
  neutro: cores.tx2,
  marca: cores.tinta,
};

export function CartaoAviso({ aviso }: { aviso: AvisoDTO }) {
  const marcar = useMarcarLidos();
  const tom = TOM[aviso.tipo] ?? "neutro";
  const Icone = ICONE[aviso.tipo] ?? Megaphone;
  const abrir = () => {
    if (!aviso.lido) marcar.mutate({ ids: [aviso.id] });
    if (aviso.contest_id) router.push(`/concurso/${aviso.contest_id}`);
    else void abrirLink(aviso.url_oficial);
  };
  return (
    <Card
      onPress={abrir}
      rotuloAcessivel={`${aviso.lido ? "" : "Novo. "}${ALERT_TIPO_LABEL[aviso.tipo]}: ${aviso.titulo}. ${aviso.corpo}`}
      style={!aviso.lido && s.naoLido}
    >
      <View style={s.linha}>
        <Etiqueta texto={ALERT_TIPO_LABEL[aviso.tipo]} tom={tom} />
        <View style={s.hora}>
          {!aviso.lido ? <View style={s.ponto} accessibilityLabel="Não lido" /> : null}
          <Texto variante="mono" cor={cores.tx2} style={{ fontSize: 11.5 }}>
            {quando(aviso.created_at)}
          </Texto>
        </View>
      </View>
      <View style={s.titulo}>
        <Icone size={18} color={COR_ICONE[tom]} strokeWidth={2.4} style={{ marginTop: 1 }} />
        <Texto variante="h3" style={{ flex: 1 }}>
          {aviso.titulo}
        </Texto>
      </View>
      <Texto variante="meta">{aviso.corpo}</Texto>
      {aviso.url_oficial ? (
        <Pressionavel
          onPress={() => void abrirLink(aviso.url_oficial)}
          style={s.link}
          accessibilityRole="link"
          accessibilityLabel="Ver no site oficial"
          hitSlop={6}
        >
          <ExternalLink size={14} color={cores.azul} strokeWidth={2.4} />
          <Texto variante="corpoForte" cor={cores.azul} style={{ fontSize: 13 }}>
            Fonte oficial
          </Texto>
        </Pressionavel>
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  naoLido: { borderColor: cores.azulSuave },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  hora: { flexDirection: "row", alignItems: "center", gap: 6 },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.azul },
  titulo: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  link: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 32 },
});
