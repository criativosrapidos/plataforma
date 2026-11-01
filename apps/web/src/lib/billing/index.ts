import "server-only";
import type { Ciclo, Plano } from "@aviso/shared";
import { mockProvider } from "./mock";

/**
 * Provedor de cobrança. Implementações: mock (dev) e asaas (produção, Pix automático e cartão).
 * O webhook do provedor é a fonte da verdade para status de pagamento.
 */
export interface BillingProvider {
  nome: string;
  /** Cria cliente + assinatura com 1ª cobrança no fim do teste. Devolve ids e, se houver, URL para concluir no provedor. */
  criarAssinatura(p: {
    userId: string;
    nome: string;
    email: string;
    plano: Plano;
    ciclo: Ciclo;
    metodo: "cartao" | "pix_automatico";
    valorCentavos: number;
    primeiraCobranca: Date;
  }): Promise<{ customerId: string; subscriptionId: string; checkoutUrl: string | null }>;
  atualizarValor(p: { subscriptionId: string; valorCentavos: number; ciclo: Ciclo }): Promise<void>;
  cancelarAssinatura(subscriptionId: string): Promise<void>;
}

const provedores: Record<string, () => Promise<BillingProvider>> = {
  mock: async () => mockProvider,
  // asaas: async () => (await import("./asaas")).asaasProvider,
};

export async function billing(): Promise<BillingProvider> {
  const nome = process.env.BILLING_PROVIDER ?? "mock";
  const f = provedores[nome];
  if (!f) throw new Error(`BILLING_PROVIDER desconhecido: ${nome}`);
  return f();
}

export function registrarProvedor(nome: string, f: () => Promise<BillingProvider>) {
  provedores[nome] = f;
}
