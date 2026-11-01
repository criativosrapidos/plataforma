// Pressable com microinteração: encolhe um pouco ao tocar (mola) e vibra de leve.
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { vibrar } from "@/lib/vibrar";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressionavelProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  /** Quanto encolhe ao pressionar (1 = nada). */
  escala?: number;
  /** Tipo de vibração no toque. */
  haptico?: "toque" | "selecao" | "nenhum";
  /** Na web, papel "button" vira <button>; cartões que contêm botões usam isto para não aninhar botões. */
  semPapel?: boolean;
}

const MOLA = { damping: 18, stiffness: 420, mass: 0.6 };

export function Pressionavel({
  style,
  escala = 0.97,
  haptico = "toque",
  semPapel,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...props
}: PressionavelProps) {
  const s = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole={semPapel ? undefined : "button"}
      disabled={disabled}
      onPressIn={(e) => {
        s.set(withSpring(escala, MOLA));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, MOLA));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptico === "toque") vibrar.toque();
        else if (haptico === "selecao") vibrar.selecao();
        onPress?.(e);
      }}
      style={[Platform.OS === "web" && !disabled ? ({ cursor: "pointer" } as ViewStyle) : null, style, animado]}
      {...props}
    />
  );
}
