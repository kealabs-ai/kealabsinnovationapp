"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingEngine = void 0;
const pricing_strategy_1 = require("../strategies/pricing.strategy");
class PricingEngine {
    static resolveStrategy(serviceType) {
        if (serviceType === 'WEB')
            return new pricing_strategy_1.WebPricingStrategy();
        if (serviceType === 'BI')
            return new pricing_strategy_1.BIPricingStrategy();
        if (serviceType === 'MINI_SITE')
            return new pricing_strategy_1.MiniSitePricingStrategy();
        if (serviceType === 'AI_AGENT')
            return new pricing_strategy_1.AIAgentPricingStrategy();
        throw new Error(`Unknown serviceType: ${serviceType}`);
    }
    static calculate(input) {
        const strategy = PricingEngine.resolveStrategy(input.serviceType);
        return strategy.calculate(input);
    }
}
exports.PricingEngine = PricingEngine;
//# sourceMappingURL=pricing.engine.js.map