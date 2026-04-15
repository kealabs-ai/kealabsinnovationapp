import type { PricingInput, PricingResult } from '../types';
export interface PricingStrategy {
    calculate(input: PricingInput): PricingResult;
}
export declare class WebPricingStrategy implements PricingStrategy {
    calculate(input: PricingInput): PricingResult;
}
export declare class BIPricingStrategy implements PricingStrategy {
    calculate(input: PricingInput): PricingResult;
}
export declare class AIAgentPricingStrategy implements PricingStrategy {
    calculate(input: PricingInput): PricingResult;
}
export declare class MiniSitePricingStrategy implements PricingStrategy {
    calculate(input: PricingInput): PricingResult;
}
//# sourceMappingURL=pricing.strategy.d.ts.map