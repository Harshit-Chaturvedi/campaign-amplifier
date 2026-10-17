export interface DemoConfig {
  cpmUsd: number;          // Advertising CPM in USD ($14.50 per 1,000 ad impressions)
  avgFrequency: number;    // Average frequency of ad impressions per reached person (2.2x)
  platformFeePct: number;  // Platform fee percentage (0.05 = 5%)
  paymentFeePct: number;   // Payment processing fee percentage (0.029 = 2.9% + $0.30 fixed)
  paymentFeeFixed: number; // Fixed payment fee in USD ($0.30)
  minGoal: number;         // Minimum campaign funding goal in USD ($500)
  maxGoal: number;         // Maximum campaign funding goal in USD ($50,000)
  presetAmounts: number[]; // Preset backer contribution buttons in USD
  presetGoals: number[];   // Common funding goals for creators
  defaultDurationDays: number;
}

export const demoConfig: DemoConfig = {
  cpmUsd: 14.50,
  avgFrequency: 2.2,
  platformFeePct: 0.05,
  paymentFeePct: 0.029,
  paymentFeeFixed: 0.30,
  minGoal: 500,
  maxGoal: 50000,
  presetAmounts: [10, 25, 50, 100, 250],
  presetGoals: [2500, 5000, 10000, 25000],
  defaultDurationDays: 30,
};
