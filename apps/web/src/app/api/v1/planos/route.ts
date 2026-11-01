import { ok, rota } from "@/lib/api";
import { PLANO_INFO, TRIAL_DAYS } from "@aviso/shared";

export const GET = rota(async () => ok({ trialDias: TRIAL_DAYS, planos: Object.values(PLANO_INFO) }));
