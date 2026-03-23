import { WebPricingStrategy, BIPricingStrategy, MiniSitePricingStrategy, AIAgentPricingStrategy, PricingStrategy } from '../strategies/pricing.strategy';
import type { PricingInput, PricingResult } from '../types';

export class PricingEngine {
  private static resolveStrategy(serviceType: string): PricingStrategy {
    if (serviceType === 'WEB') return new WebPricingStrategy();
    if (serviceType === 'BI') return new BIPricingStrategy();
    if (serviceType === 'MINI_SITE') return new MiniSitePricingStrategy();
    if (serviceType === 'AI_AGENT') return new AIAgentPricingStrategy();
    throw new Error(`Unknown serviceType: ${serviceType}`);
  }

  static calculate(input: PricingInput): PricingResult {
    const strategy = PricingEngine.resolveStrategy(input.serviceType);
    return strategy.calculate(input);
  }
}
