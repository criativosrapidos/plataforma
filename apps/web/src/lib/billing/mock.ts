import "server-only";
import { randomUUID } from "node:crypto";
import type { BillingProvider } from "./index";

/** Provedor falso para desenvolvimento: aprova tudo, sem cobrar. */
export const mockProvider: BillingProvider = {
  nome: "mock",
  async criarAssinatura() {
    return { customerId: `mock_cus_${randomUUID()}`, subscriptionId: `mock_sub_${randomUUID()}`, checkoutUrl: null };
  },
  async atualizarValor() {},
  async cancelarAssinatura() {},
};
