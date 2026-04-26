import { useState, useEffect, useRef } from 'react';
import { agentsApi } from './api';
import type { AgentTone } from './api';

export interface AgentProfileLocal {
  id?: string;
  name: string;
  company: string;
  tone: AgentTone;
  role: string;
  systemPrompt: string;
  services: string;
  objections: string;
  closingStyle: string;
  llm_model?: string;
}

export const TONE_LABELS: Record<AgentTone, string> = {
  formal:     'Formal — linguagem corporativa e objetiva',
  friendly:   'Amigável — próximo, descontraído e empático',
  technical:  'Técnico — foco em detalhes e especificações',
  consultive: 'Consultivo — faz perguntas, entende a dor antes de vender',
};

const DEFAULTS: AgentProfileLocal = {
  name: 'Kea',
  company: 'KeaLabs',
  tone: 'consultive',
  role: 'Consultora Comercial',
  systemPrompt: '',
  services: 'Sites Web, Mini Sites com Instagram, Business Intelligence, AI Agents',
  objections: 'Reconheça a objeção, valide a preocupação do cliente e reposicione o valor antes do preço.',
  closingStyle: 'Proponha um próximo passo concreto: agendar uma call, enviar uma proposta ou iniciar um projeto piloto.',
};

const CACHE_KEY = 'keaflow-agent-profile';

export function useAgentProfile() {
  const [profile, setProfile] = useState<AgentProfileLocal>(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  const agentIdRef = useRef<string | undefined>(profile.id);

  // Carrega perfil ativo do servidor na montagem
  useEffect(() => {
    agentsApi.active().then((r) => {
      const a = Array.isArray(r.data) ? r.data[0] : r.data;
      if (!a) return;
      const merged: AgentProfileLocal = {
        id: a.id,
        name: a.name,
        company: a.company,
        tone: a.tone,
        role: a.role,
        systemPrompt: a.system_prompt ?? '',
        services: a.services,
        objections: a.objections,
        closingStyle: a.closing_style,
        llm_model: a.llm_model ?? 'gemini-2.0-flash',
      };
      agentIdRef.current = a.id;
      setProfile(merged);
      localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    }).catch(() => { /* usa cache local */ });
  }, []);

  const update = (patch: Partial<AgentProfileLocal>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));

      const body = {
        name: next.name,
        company: next.company,
        tone: next.tone,
        role: next.role,
        system_prompt: next.systemPrompt,
        services: next.services,
        objections: next.objections,
        closing_style: next.closingStyle,
        llm_model: next.llm_model ?? 'gemini-2.0-flash',
        is_active: 1,
      };

      if (agentIdRef.current) {
        agentsApi.update({ id: agentIdRef.current, ...body }).catch((err) => {
          // Se o agente não existe mais no banco, cria um novo
          if (err?.response?.status === 404) {
            agentIdRef.current = undefined;
            agentsApi.create({ ...body, is_active: true }).then((r) => {
              agentIdRef.current = r.data.id;
              setProfile((p) => ({ ...p, id: r.data.id }));
              localStorage.setItem(CACHE_KEY, JSON.stringify({ ...next, id: r.data.id }));
            }).catch(() => {});
          }
        });
      } else {
        agentsApi.create(body).then((r) => {
          agentIdRef.current = r.data.id;
          setProfile((p) => ({ ...p, id: r.data.id }));
        }).catch(() => {});
      }

      return next;
    });
  };

  const reset = () => {
    const next = { ...DEFAULTS, id: agentIdRef.current };
    setProfile(next);
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    if (agentIdRef.current) {
      agentsApi.update({
        id: agentIdRef.current,
        name: DEFAULTS.name, company: DEFAULTS.company, tone: DEFAULTS.tone,
        role: DEFAULTS.role, system_prompt: DEFAULTS.systemPrompt,
        services: DEFAULTS.services, objections: DEFAULTS.objections,
        closing_style: DEFAULTS.closingStyle, llm_model: 'gemini-2.0-flash', is_active: 1,
      }).catch(() => {});
    }
  };

  return { profile, update, reset, DEFAULTS };
}
