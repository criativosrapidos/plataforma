// Número que "sobe" até o valor (contagem regressiva da próxima prova).
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useNumeroAnimado(alvo: number, duracao = 700): number {
  const [v, setV] = useState(alvo);
  const anterior = useRef<number | null>(null);
  useEffect(() => {
    let cancelado = false;
    let quadro = 0;
    const de = anterior.current ?? 0;
    anterior.current = alvo;
    if (de === alvo) {
      setV(alvo);
      return;
    }
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduzir) => {
        if (cancelado) return;
        if (reduzir) {
          setV(alvo);
          return;
        }
        const t0 = Date.now();
        const passo = () => {
          if (cancelado) return;
          const p = Math.min(1, (Date.now() - t0) / duracao);
          const e = 1 - Math.pow(1 - p, 3);
          setV(Math.round(de + (alvo - de) * e));
          if (p < 1) quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
      })
      .catch(() => setV(alvo));
    return () => {
      cancelado = true;
      cancelAnimationFrame(quadro);
    };
  }, [alvo, duracao]);
  return v;
}
