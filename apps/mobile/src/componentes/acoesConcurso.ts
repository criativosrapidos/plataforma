// Acompanhar / deixar de acompanhar com feedback: vibração, toast e (na 1ª vez) o pedido de notificação.
import { useAcompanhar, useDeixarDeAcompanhar } from "@/api/consultas";
import { mensagemDeErro } from "@/api/cliente";
import { useNotificacoes } from "@/contexto/Notificacoes";
import { vibrar } from "@/lib/vibrar";
import { useToast } from "./Toast";

export function useAcoesConcurso() {
  const acompanharM = useAcompanhar();
  const deixarM = useDeixarDeAcompanhar();
  const toast = useToast();
  const { talvezPedirPermissao } = useNotificacoes();

  function acompanhar(contestId: string, nome: string, roleId?: string | null) {
    vibrar.sucesso();
    acompanharM.mutate(
      { contestId, roleId },
      {
        onSuccess: () => {
          toast.mostrar(`Acompanhando ${nome}. Os prazos já estão na sua agenda.`);
          void talvezPedirPermissao();
        },
        onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
      },
    );
  }

  function deixar(contestId: string, nome: string) {
    vibrar.forte();
    deixarM.mutate(contestId, {
      onSuccess: () =>
        toast.mostrar(`Você deixou de acompanhar ${nome}.`, "info", {
          rotulo: "Desfazer",
          aoPressionar: () => acompanharM.mutate({ contestId }),
        }),
      onError: (e) => toast.mostrar(mensagemDeErro(e), "erro"),
    });
  }

  const ocupado = (contestId: string) =>
    (acompanharM.isPending && acompanharM.variables?.contestId === contestId) || (deixarM.isPending && deixarM.variables === contestId);

  return { acompanhar, deixar, ocupado };
}
