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
  installmentLimit: number;
  installmentInterestRate: number;
  installmentMdr1x: number;
  installmentMdr2_6x: number;
  installmentMdr7_12x: number;
  installmentMdr13x: number;
  installmentTaxaFixa: number;
  installmentAntecipacaoMensal: number;
  installmentCicloDias: number;
  commissionRate: number;
  llmProvider: string;
  llmModel: string;
  apiKeyGemini: string;
  apiKeyOpenai: string;
  apiKeyAnthropic: string;
  apiKeyGroq: string;
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
  installmentLimit: 'installment_limit',
  installmentInterestRate: 'installment_interest_rate',
  installmentMdr1x: 'installment_mdr_1x',
  installmentMdr2_6x: 'installment_mdr_2_6x',
  installmentMdr7_12x: 'installment_mdr_7_12x',
  installmentMdr13x: 'installment_mdr_13x',
  installmentTaxaFixa: 'installment_taxa_fixa',
  installmentAntecipacaoMensal: 'installment_antecipacao_mensal',
  installmentCicloDias: 'installment_ciclo_dias',
  commissionRate: 'commission_rate',
  llmProvider: 'llm_provider',
  llmModel: 'llm_model',
  apiKeyGemini: 'api_key_gemini',
  apiKeyOpenai: 'api_key_openai',
  apiKeyAnthropic: 'api_key_anthropic',
  apiKeyGroq: 'api_key_groq',
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
  installmentLimit: 12,
  installmentInterestRate: 0,
  installmentMdr1x: 2.99,
  installmentMdr2_6x: 3.49,
  installmentMdr7_12x: 3.99,
  installmentMdr13x: 4.29,
  installmentTaxaFixa: 0.49,
  installmentAntecipacaoMensal: 1.7,
  installmentCicloDias: 32,
  commissionRate: 0,
  llmProvider: 'gemini',
  llmModel: 'gemini-2.0-flash',
  apiKeyGemini: '',
  apiKeyOpenai: '',
  apiKeyAnthropic: '',
  apiKeyGroq: '',
};

const CACHE_KEY = 'keaflow-settings';

function fromApi(rows: { setting_key: string; setting_value: string }[]): ServiceSettings {
  const reverseMap = Object.fromEntries(
    Object.entries(KEY_MAP).map(([k, v]) => [v, k as keyof ServiceSettings])
  );
  const result: Partial<ServiceSettings> = {};
  const STRING_KEYS: (keyof ServiceSettings)[] = ['llmProvider', 'llmModel', 'apiKeyGemini', 'apiKeyOpenai', 'apiKeyAnthropic', 'apiKeyGroq'];
  for (const row of rows) {
    const key = reverseMap[row.setting_key];
    if (key) {
      if (STRING_KEYS.includes(key)) {
        (result as Record<string, unknown>)[key] = row.setting_value;
      } else {
        const val = parseFloat(row.setting_value);
        (result as Record<string, unknown>)[key] = key === 'installmentInterestRate' ? val / 100 : val;
      }
    }
  }
  return { ...DEFAULTS, ...result };
}

export function useSettings() {
  const [settings, setSettings] = useState<ServiceSettings>(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      // Merge com DEFAULTS garante que campos novos ausentes no cache não fiquem undefined
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : null;
    } catch { return null; }
  });

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsApi.list().then((r) => {
      const rows = Array.isArray(r.data) ? r.data : [];
      if (rows.length > 0) {
        const fromServer = fromApi(rows);
        setSettings(fromServer);
        localStorage.setItem(CACHE_KEY, JSON.stringify(fromServer));
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const update = (patch: Partial<ServiceSettings>) => {
    const STRING_KEYS: (keyof ServiceSettings)[] = ['llmProvider', 'llmModel', 'apiKeyGemini', 'apiKeyOpenai', 'apiKeyAnthropic', 'apiKeyGroq'];
    const API_KEY_FIELDS: (keyof ServiceSettings)[] = ['apiKeyGemini', 'apiKeyOpenai', 'apiKeyAnthropic', 'apiKeyGroq'];
    setSettings((prev) => {
      const next = { ...prev, ...patch } as ServiceSettings;
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      for (const [k, v] of Object.entries(patch) as [keyof ServiceSettings, unknown][]) {
        if (API_KEY_FIELDS.includes(k)) continue; // salvas via settingsApi.saveLlmKeys no handleSave
        const dbKey = KEY_MAP[k];
        const apiVal = STRING_KEYS.includes(k)
          ? String(v)
          : k === 'installmentInterestRate'
            ? String((v as number) * 100)
            : String(v);
        if (dbKey) settingsApi.upsert(dbKey, apiVal).catch(() => {});
      }
      return next;
    });
  };

  const reset = () => {
    setSettings(null as unknown as ServiceSettings);
    localStorage.removeItem(CACHE_KEY);
  };

  return { settings: settings ?? DEFAULTS, update, reset, DEFAULTS, loaded };
}
