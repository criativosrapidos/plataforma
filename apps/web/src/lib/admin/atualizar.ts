import "server-only";
import { revalidatePath } from "next/cache";

/** Após uma mutação do painel: re-renderiza a rota atual e o layout (badge da fila etc.). */
export function atualizarPainel() {
  revalidatePath("/", "layout");
}
