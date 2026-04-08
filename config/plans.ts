export interface PlanConfig {
  maxCuentas: number;
  scanIA: boolean;
  voz: boolean;
  metas: boolean;
  historialMeses: number;
  reportesAvanzados: boolean;
  planFamiliar: boolean;
}

export const PLANS: Record<'free' | 'pro', PlanConfig> = {
  free: {
    maxCuentas: 2,
    scanIA: false,
    voz: false,
    metas: false,
    historialMeses: 3,
    reportesAvanzados: false,
    planFamiliar: false,
  },
  pro: {
    maxCuentas: Infinity,
    scanIA: true,
    voz: true,
    metas: true,
    historialMeses: Infinity,
    reportesAvanzados: true,
    planFamiliar: true,
  },
};
