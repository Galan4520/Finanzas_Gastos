import { useAuth } from '../contexts/AuthContext';
import { PLANS, PlanConfig } from '../config/plans';

interface UsePlanReturn {
  plan: PlanConfig;
  isPro: boolean;
}

export function usePlan(): UsePlanReturn {
  const { isSubscribed } = useAuth();
  const FORCE_FREE = false; // ← cambia a true para probar plan Free
  const isPro = isSubscribed && !FORCE_FREE;
  const plan = isPro ? PLANS.pro : PLANS.free;
  return { plan, isPro };
}
