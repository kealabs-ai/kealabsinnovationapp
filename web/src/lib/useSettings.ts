import { useState, useEffect } from 'react';

export interface ServiceSettings {
  // WEB
  webBase: number;
  webExtraMenuPrice: number;
  webAsaasIntegration: number;
  webFreeMenus: number;
  // MINI SITE
  miniSiteBase: number;
  miniSiteExtraPagePrice: number;
  miniSiteInstagram: number;
  miniSiteWhatsapp: number;
  miniSiteFreePages: number;
  // BI
  biExcel: number;
  biApi: number;
  biDatabase: number;
  biAdvancedMultiplier: number;
  // AI AGENT plans
  agentFreeSetup: number;
  agentFreeMonthly: number;
  agentStarterSetup: number;
  agentStarterMonthly: number;
  agentProSetup: number;
  agentProMonthly: number;
  agentEnterpriseSetup: number;
  agentEnterpriseMonthly: number;
  agentExtraAgentPrice: number;
  agentRAG: number;
  agentVoice: number;
  // Módulos
  moduleN8n: number;
  moduleWhatsapp: number;
  moduleAgileSetup: number;
  moduleMentoringHour: number;
  // Hosting
  hostingSingle: number;
  hostingPremium: number;
  hostingBusiness: number;
  hostingVpsStarter: number;
  hostingVpsPro: number;
  hostingVpsUltra: number;
  // Suporte mensal (% do setup)
  monthlySupportRate: number;
}

const DEFAULTS: ServiceSettings = {
  webBase: 3000,
  webExtraMenuPrice: 300,
  webAsaasIntegration: 1000,
  webFreeMenus: 6,
  miniSiteBase: 1200,
  miniSiteExtraPagePrice: 200,
  miniSiteInstagram: 600,
  miniSiteWhatsapp: 200,
  miniSiteFreePages: 3,
  biExcel: 2000,
  biApi: 3500,
  biDatabase: 5000,
  biAdvancedMultiplier: 1.3,
  agentFreeSetup: 800,
  agentFreeMonthly: 0,
  agentStarterSetup: 1800,
  agentStarterMonthly: 149,
  agentProSetup: 3500,
  agentProMonthly: 349,
  agentEnterpriseSetup: 8000,
  agentEnterpriseMonthly: 799,
  agentExtraAgentPrice: 400,
  agentRAG: 1200,
  agentVoice: 900,
  moduleN8n: 1200,
  moduleWhatsapp: 900,
  moduleAgileSetup: 1500,
  moduleMentoringHour: 200,
  hostingSingle: 12.99,
  hostingPremium: 17.99,
  hostingBusiness: 26.99,
  hostingVpsStarter: 49.90,
  hostingVpsPro: 89.90,
  hostingVpsUltra: 149.90,
  monthlySupportRate: 0.1,
};

const KEY = 'keaflow-settings';

export function useSettings() {
  const [settings, setSettings] = useState<ServiceSettings>(() => {
    try {
      const stored = localStorage.getItem(KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (patch: Partial<ServiceSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    setSettings(DEFAULTS);
    localStorage.removeItem(KEY);
  };

  return { settings, update, reset, DEFAULTS };
}
