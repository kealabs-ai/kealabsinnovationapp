import { useState, useEffect } from 'react';

export interface AgentProfile {
  name: string;           // nome do agente
  company: string;        // nome da empresa
  tone: 'formal' | 'friendly' | 'technical' | 'consultive';
  role: string;           // ex: "Consultor Comercial Sênior"
  systemPrompt: string;   // instruções livres adicionais
  services: string;       // quais serviços pode oferecer
  objections: string;     // como lidar com objeções
  closingStyle: string;   // estilo de fechamento
}

export const TONE_LABELS: Record<AgentProfile['tone'], string> = {
  formal:      'Formal — linguagem corporativa e objetiva',
  friendly:    'Amigável — próximo, descontraído e empático',
  technical:   'Técnico — foco em detalhes e especificações',
  consultive:  'Consultivo — faz perguntas, entende a dor antes de vender',
};

const DEFAULTS: AgentProfile = {
  name: 'Kea',
  company: 'KeaLabs',
  tone: 'consultive',
  role: 'Consultora Comercial',
  systemPrompt: '',
  services: 'Sites Web, Mini Sites com Instagram, Business Intelligence, AI Agents',
  objections: 'Reconheça a objeção, valide a preocupação do cliente e reposicione o valor antes do preço.',
  closingStyle: 'Proponha um próximo passo concreto: agendar uma call, enviar uma proposta ou iniciar um projeto piloto.',
};

const KEY = 'keaflow-agent-profile';

export function useAgentProfile() {
  const [profile, setProfile] = useState<AgentProfile>(() => {
    try {
      const stored = localStorage.getItem(KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }, [profile]);

  const update = (patch: Partial<AgentProfile>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    setProfile(DEFAULTS);
    localStorage.removeItem(KEY);
  };

  return { profile, update, reset, DEFAULTS };
}
