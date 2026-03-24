import { useState, useEffect } from 'react';
import { settingsApi } from './api';

export interface ServiceSettings {
  webBase: number;
  webExtraMenuPrice: number;
  webAsaasIntegration: number;
  webFreeMenus: number;
  miniSiteBase: number;
  miniSiteExtraPagePrice: number;
  miniSiteInstagram: number;
  miniSiteWhatsapp: number;
  miniSiteFreePages: number;
  biExcel: number;
  biApi: number;
  biDatabase: number;
  biAdvancedMultiplier: number;
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
  moduleN8n: number;
  moduleWhatsapp: number;
  moduleAgileSetup: number;
  moduleMentoringHour: number;
  hostingSingle: number;
  hostingPremium: number;
  hostingBusiness: number;
  hostingVpsStarter: number;
  hostingVpsPro: number;
  hostingVpsUltra: number;
  monthlySupportRate: number;
}

// Mapa: chave do frontend → setting_key no banco
const KEY_MAP: Record<keyof ServiceSettings, string> = {
  webBase: 'web_base', webExtraMenuPrice: 'web_extra_menu_price',
  webAsaasIntegration: 'web_asaas_integration', webFreeMenus: 'web_free_menus',
  miniSiteBase: 'mini_site_base', miniSiteExtraPagePrice: 'mini_site_extra_page',
  miniSiteInstagram: 'mini_site_instagram', miniSiteWhatsapp: 'mini_site_whatsapp',
  miniSiteFreePages: 'mini_site_free_pages',
  biExcel: 'bi_excel', biApi: 'bi_api', biDatabase: 'bi_database',
  biAdvancedMultiplier: 'bi_advanced_multiplier',
  agentFreeSetup: 'agent_free_setup', agentFreeMonthly: 'agent_free_monthly',
  agentStarterSetup: 'agent_starter_setup', agentStarterMonthly: 'agent_starter_monthly',
  agentProSetup: 'agent_pro_setup', agentProMonthly: 'agent_pro_monthly',
  agentEnterpriseSetup: 'agent_enterprise_setup', agentEnterpriseMonthly: 'agent_enterprise_monthly',
  agentExtraAgentPrice: 'agent_extra_agent_price',
  agentRAG: 'agent_rag', agentVoice: 'agent_voice',
  moduleN8n: 'module_n8n', moduleWhatsapp: 'module_whatsapp',
  moduleAgileSetup: 'module_agile_setup', moduleMentoringHour: 'module_mentoring_hour',
  hostingSingle: 'hosting_single', hostingPremium: 'hosting_premium',
  hostingBusiness: 'hosting_business', hostingVpsStarter: 'hosting_vps_starter',
  hostingVpsPro: 'hosting_vps_pro', hostingVpsUltra: 'hosting_vps_ultra',
  monthlySupportRate: 'monthly_support_rate',
};

export const DEFAULTS: ServiceSettings = {
  webBase: 3000, webExtraMenuPrice: 300, webAsaasIntegration: 1000, webFreeMenus: 6,
  miniSiteBase: 1200, miniSiteExtraPagePrice: 200, miniSiteInstagram: 600,
  miniSiteWhatsapp: 200, miniSiteFreePages: 3,
  biExcel: 2000, biApi: 3500, biDatabase: 5000, biAdvancedMultiplier: 1.3,
  agentFreeSetup: 800, agentFreeMonthly: 0,
  agentStarterSetup: 1800, agentStarterMonthly: 149,
  agentProSetup: 3500, agentProMonthly: 349,
  agentEnterpriseSetup: 8000, agentEnterpriseMonthly: 799,
  agentExtraAgentPrice: 400, agentRAG: 1200, agentVoice: 900,
  moduleN8n: 1200, moduleWhatsapp: 900, moduleAgileSetup: 1500, moduleMentoringHour: 200,
  hostingSingle: 12.99, hostingPremium: 17.99, hostingBusiness: 26.99,
  hostingVpsStarter: 49.90, hostingVpsPro: 89.90, hostingVpsUltra: 149.90,
  monthlySupportRate: 0.1,
};

const CACHE_KEY = 'keaflow-settings';

function fromApi(rows: { setting_key: string; setting_value: string }[]): Partial<ServiceSettings> {
  const reverseMap = Object.fromEntries(
    Object.entries(KEY_MAP).map(([k, v]) => [v, k as keyof ServiceSettings])
  );
  const result: Partial<ServiceSettings> = {};
  for (const row of rows) {
    const key = reverseMap[row.setting_key];
    if (key) result[key] = parseFloat(row.setting_value);
  }
  return result;
}

export function useSettings() {
  const [settings, setSettings] = useState<ServiceSettings>(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  // Carrega do servidor na montagem
  useEffect(() => {
    settingsApi.list().then((r) => {
      const merged = { ...DEFAULTS, ...fromApi(r.data.data) };
      setSettings(merged);
      localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    }).catch(() => { /* usa cache local */ });
  }, []);

  const update = (patch: Partial<ServiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      // Persiste cada chave alterada no servidor
      for (const [k, v] of Object.entries(patch) as [keyof ServiceSettings, number][]) {
        const dbKey = KEY_MAP[k];
        if (dbKey) settingsApi.upsert(dbKey, String(v)).catch(() => {});
      }
      return next;
    });
  };

  const reset = () => {
    setSettings(DEFAULTS);
    localStorage.removeItem(CACHE_KEY);
    // Restaura todos os defaults no servidor
    for (const [k, v] of Object.entries(DEFAULTS) as [keyof ServiceSettings, number][]) {
      settingsApi.upsert(KEY_MAP[k], String(v)).catch(() => {});
    }
  };

  return { settings, update, reset, DEFAULTS };
}
