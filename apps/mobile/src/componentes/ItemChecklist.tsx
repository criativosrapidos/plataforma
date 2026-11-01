import { StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import type { ChecklistItemDTO } from "@aviso/shared";
import { vibrar } from "@/lib/vibrar";
import { cores, TOQUE_MIN } from "@/tema";
import { CaixaMarcar } from "./Controles";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

export function ItemChecklist({
  item,
  aoMarcar,
  aoRemover,
  cor = cores.verde,
}: {
  item: ChecklistItemDTO;
  aoMarcar: (feito: boolean) => void;
  aoRemover?: () => void;
  cor?: string;
}) {
  return (
    <View style={s.linha}>
      <Pressionavel
        onPress={() => {
          if (!item.feito) vibrar.sucesso();
          aoMarcar(!item.feito);
        }}
        haptico="nenhum"
        escala={0.98}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.feito }}
        accessibilityLabel={item.texto}
        style={s.toque}
        testID={`check-${item.ordem}`}
      >
        <CaixaMarcar marcado={item.feito} cor={cor} />
        <Texto variante="corpo" style={[s.texto, item.feito && s.feito]}>
          {item.texto}
        </Texto>
      </Pressionavel>
      {aoRemover ? (
        <Pressionavel onPress={aoRemover} accessibilityLabel={`Remover "${item.texto}"`} style={s.remover} escala={0.9}>
          <X size={16} color={cores.tx2} strokeWidth={2.4} />
        </Pressionavel>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center" },
  toque: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minHeight: TOQUE_MIN, paddingVertical: 4 },
  texto: { flex: 1, fontSize: 14.5, lineHeight: 20 },
  feito: { color: cores.tx2, textDecorationLine: "line-through" },
  remover: { width: TOQUE_MIN, height: TOQUE_MIN, alignItems: "center", justifyContent: "center", marginRight: -10 },
});
