// Toast no topo da tela: confirmações curtas ("Acompanhando. Prazos na sua agenda.").
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircleAlert, CircleCheck, Info } from "lucide-react-native";
import { vibrar } from "@/lib/vibrar";
import { cores, sombraForte } from "@/tema";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

type Tipo = "sucesso" | "erro" | "info";
interface ToastItem {
  id: number;
  texto: string;
  tipo: Tipo;
  acao?: { rotulo: string; aoPressionar: () => void };
}
interface Ctx {
  mostrar: (texto: string, tipo?: Tipo, acao?: ToastItem["acao"]) => void;
}

const ContextoToast = createContext<Ctx>({ mostrar: () => {} });

export function useToast() {
  return useContext(ContextoToast);
}

const ICONES = { sucesso: CircleCheck, erro: CircleAlert, info: Info };
const COR_ICONE = { sucesso: "#5BD48F", erro: "#FF8A8F", info: cores.marca };

export function ProvedorToast({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const insets = useSafeAreaInsets();

  const mostrar = useCallback<Ctx["mostrar"]>((texto, tipo = "sucesso", acao) => {
    if (timer.current) clearTimeout(timer.current);
    seq.current += 1;
    setItem({ id: seq.current, texto, tipo, acao });
    if (tipo === "erro") vibrar.erro();
    AccessibilityInfo.announceForAccessibility?.(texto);
    timer.current = setTimeout(() => setItem(null), acao ? 4200 : 2600);
  }, []);

  const valor = useMemo(() => ({ mostrar }), [mostrar]);
  const Icone = item ? ICONES[item.tipo] : null;

  return (
    <ContextoToast.Provider value={valor}>
      {children}
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8 }]}>
        {item && Icone ? (
          <Animated.View
            key={item.id}
            entering={FadeInUp.springify().damping(18)}
            exiting={FadeOutUp.duration(180)}
            style={[s.toast, sombraForte]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Icone size={20} color={COR_ICONE[item.tipo]} strokeWidth={2.4} />
            <Texto variante="corpoForte" cor={cores.branco} style={s.texto}>
              {item.texto}
            </Texto>
            {item.acao ? (
              <Pressionavel
                onPress={() => {
                  item.acao?.aoPressionar();
                  setItem(null);
                }}
                style={s.acao}
                accessibilityLabel={item.acao.rotulo}
              >
                <Texto variante="corpoForte" cor={cores.marca} style={{ fontSize: 14 }}>
                  {item.acao.rotulo}
                </Texto>
              </Pressionavel>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </ContextoToast.Provider>
  );
}

const s = StyleSheet.create({
  toast: {
    marginHorizontal: 16,
    backgroundColor: cores.tinta,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "center",
    maxWidth: 528,
    width: "92%",
  },
  texto: { flex: 1, fontSize: 14, lineHeight: 19 },
  acao: { minHeight: 36, justifyContent: "center", paddingHorizontal: 6 },
});
