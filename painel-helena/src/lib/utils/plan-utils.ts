/**
 * Utilitários para gerenciamento de planos de assinatura
 */

export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';
export type PlanChangeType = 'initial' | 'upgrade' | 'downgrade' | 'change' | 'cancellation';

/**
 * Retorna o label traduzido do ciclo de cobrança
 */
export const getBillingCycleLabel = (cycle: BillingCycle): string => {
  const labels: Record<BillingCycle, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual',
    custom: 'Personalizado'
  };
  return labels[cycle] || cycle;
};

/**
 * Retorna o número de dias em um ciclo de cobrança
 */
export const getBillingCycleDays = (cycle: BillingCycle, customDays?: number): number => {
  const days: Record<BillingCycle, number> = {
    monthly: 30,
    quarterly: 90,
    semiannual: 180,
    annual: 365,
    custom: customDays || 30
  };
  return days[cycle];
};

/**
 * Calcula valor proporcional (prorata)
 */
export const calculateProrata = (
  currentPrice: number,
  newPrice: number,
  daysUsed: number,
  totalDaysInCycle: number
): number => {
  const remainingDays = totalDaysInCycle - daysUsed;
  const currentDailyRate = currentPrice / totalDaysInCycle;
  const newDailyRate = newPrice / totalDaysInCycle;
  
  const refund = currentDailyRate * remainingDays;
  const newCharge = newDailyRate * remainingDays;
  
  return newCharge - refund;
};

/**
 * Determina o tipo de mudança de plano
 */
export const determineChangeType = (
  oldPrice: number | null,
  newPrice: number | null,
  oldResources?: any,
  newResources?: any
): PlanChangeType => {
  if (!oldPrice) return 'initial';
  if (!newPrice) return 'cancellation';
  
  if (newPrice > oldPrice) return 'upgrade';
  if (newPrice < oldPrice) return 'downgrade';
  
  return 'change';
};

/**
 * Retorna o label do tipo de mudança
 */
export const getChangeTypeLabel = (type: PlanChangeType): string => {
  const labels: Record<PlanChangeType, string> = {
    initial: 'Plano Inicial',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    change: 'Alteração',
    cancellation: 'Cancelamento'
  };
  return labels[type] || type;
};

/**
 * Retorna o ícone apropriado para o tipo de mudança
 */
export const getChangeTypeColor = (type: PlanChangeType): string => {
  const colors: Record<PlanChangeType, string> = {
    initial: 'text-blue-500',
    upgrade: 'text-green-500',
    downgrade: 'text-orange-500',
    change: 'text-gray-500',
    cancellation: 'text-red-500'
  };
  return colors[type] || 'text-gray-500';
};

/**
 * Formata preço em reais
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

/**
 * Calcula próxima data de cobrança
 */
export const calculateNextBillingDate = (
  startDate: Date,
  cycle: BillingCycle,
  customDays?: number
): Date => {
  const nextDate = new Date(startDate);
  const days = getBillingCycleDays(cycle, customDays);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};
