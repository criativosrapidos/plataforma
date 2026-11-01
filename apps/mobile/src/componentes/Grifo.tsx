// Título com "grifo" de marca-texto atrás da palavra-chave (nunca texto amarelo em fundo claro).
import { Text, type StyleProp, type TextStyle } from "react-native";
import { cores } from "@/tema";
import { Texto, type VarianteTexto } from "./Texto";

/** Use [colchetes] para marcar o trecho grifado: "Você estuda. O Aviso [vigia e organiza]." */
export function TituloGrifado({
  texto,
  variante = "titulo",
  style,
  centro,
}: {
  texto: string;
  variante?: VarianteTexto;
  style?: StyleProp<TextStyle>;
  centro?: boolean;
}) {
  const partes = texto.split(/(\[[^\]]+\])/g).filter(Boolean);
  return (
    <Texto variante={variante} style={style} centro={centro} accessibilityRole="header">
      {partes.map((p, i) =>
        p.startsWith("[") ? (
          <Text key={i} style={{ backgroundColor: cores.marca }}>
            {p.slice(1, -1)}
          </Text>
        ) : (
          p
        ),
      )}
    </Texto>
  );
}
