"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniSitePricingStrategy = exports.AIAgentPricingStrategy = exports.BIPricingStrategy = exports.WebPricingStrategy = void 0;
// ─── Hosting Plans ────────────────────────────────────────────────────────────
const HOSTING_PRICES = { single: 12.99, premium: 17.99, business: 26.99, 'vps-starter': 49.90, 'vps-pro': 89.90, 'vps-ultra': 149.90 };
// ─── Módulos compartilhados ───────────────────────────────────────────────────
function applyModules(baseSetup, modules = {}) {
    const breakdown = { base: baseSetup };
    let setup = baseSetup;
    if (modules.n8nAutomation) {
        setup += 1200;
        breakdown.n8nAutomation = 1200;
    }
    if (modules.whatsappGateway) {
        setup += 900;
        breakdown.whatsappGateway = 900;
    }
    if (modules.agileSetup) {
        setup += 1500;
        breakdown.agileSetup = 1500;
    }
    if (modules.agileMentoringHours) {
        const mentoring = modules.agileMentoringHours * 200;
        setup += mentoring;
        breakdown.agileMentoring = mentoring;
    }
    const monthly = setup * 0.1 + (modules.hosting ? HOSTING_PRICES[modules.hosting] : 0);
    if (modules.hosting)
        breakdown.hosting = HOSTING_PRICES[modules.hosting];
    breakdown.monthlySupport = parseFloat((setup * 0.1).toFixed(2));
    return {
        setupValue: parseFloat(setup.toFixed(2)),
        monthlyValue: parseFloat(monthly.toFixed(2)),
        breakdown,
    };
}
// ─── WEB Strategy ─────────────────────────────────────────────────────────────
class WebPricingStrategy {
    calculate(input) {
        const { menuCount, includeAsaasIntegration, modules } = input;
        let base = 3000;
        const breakdown = {};
        if (menuCount > 6) {
            const extra = (menuCount - 6) * 300;
            base += extra;
            breakdown.extraMenus = extra;
        }
        if (includeAsaasIntegration) {
            base += 1000;
            breakdown.asaasIntegration = 1000;
        }
        const result = applyModules(base, modules);
        return { ...result, breakdown: { ...breakdown, ...result.breakdown } };
    }
}
exports.WebPricingStrategy = WebPricingStrategy;
// ─── BI Strategy ──────────────────────────────────────────────────────────────
const BI_BASE = { excel: 2000, api: 3500, database: 5000 };
class BIPricingStrategy {
    calculate(input) {
        const { sources, complexity, modules } = input;
        const base = sources.reduce((sum, s) => sum + (BI_BASE[s] ?? 0), 0);
        const adjusted = complexity === 'advanced' ? parseFloat((base * 1.3).toFixed(2)) : base;
        const result = applyModules(adjusted, modules);
        return {
            ...result,
            breakdown: {
                ...sources.reduce((acc, s) => ({ ...acc, [s]: BI_BASE[s] }), {}),
                complexityMultiplier: complexity === 'advanced' ? 1.3 : 1,
                ...result.breakdown,
            },
        };
    }
}
exports.BIPricingStrategy = BIPricingStrategy;
// ─── AI Agent Strategy ────────────────────────────────────────────────────────
const AGENT_PLANS = {
    free: { setup: 800, monthly: 0, model: 'Gemini 2.0 Flash (gratuito)' },
    starter: { setup: 1800, monthly: 149, model: 'Gemini 2.0 Flash + memória' },
    pro: { setup: 3500, monthly: 349, model: 'Gemini 2.5 Pro / GPT-4o' },
    enterprise: { setup: 8000, monthly: 799, model: 'Multi-modelo (Gemini + GPT + Claude)' },
};
class AIAgentPricingStrategy {
    calculate(input) {
        const { plan, agentCount, includeRAG, includeVoice, modules } = input;
        const base = AGENT_PLANS[plan];
        let setup = base.setup;
        const extraBreakdown = { planSetup: base.setup };
        const extraAgents = Math.max(0, agentCount - 1);
        if (extraAgents > 0) {
            const agentExtra = extraAgents * 400;
            setup += agentExtra;
            extraBreakdown.extraAgents = agentExtra;
        }
        if (includeRAG) {
            setup += 1200;
            extraBreakdown.ragKnowledgeBase = 1200;
        }
        if (includeVoice) {
            setup += 900;
            extraBreakdown.voiceChannel = 900;
        }
        const result = applyModules(setup, modules);
        return {
            ...result,
            monthlyValue: parseFloat((result.monthlyValue + base.monthly).toFixed(2)),
            breakdown: {
                ...extraBreakdown,
                planMonthly: base.monthly,
                ...result.breakdown,
            },
        };
    }
}
exports.AIAgentPricingStrategy = AIAgentPricingStrategy;
class MiniSitePricingStrategy {
    calculate(input) {
        const { pageCount, includeInstagram, includeWhatsappButton, modules } = input;
        let base = 1200;
        const extraBreakdown = {};
        if (pageCount > 3) {
            const extra = (pageCount - 3) * 200;
            base += extra;
            extraBreakdown.extraPages = extra;
        }
        if (includeInstagram) {
            base += 600;
            extraBreakdown.instagramIntegration = 600;
        }
        if (includeWhatsappButton) {
            base += 200;
            extraBreakdown.whatsappButton = 200;
        }
        const result = applyModules(base, modules);
        return { ...result, breakdown: { ...extraBreakdown, ...result.breakdown } };
    }
}
exports.MiniSitePricingStrategy = MiniSitePricingStrategy;
//# sourceMappingURL=pricing.strategy.js.map