import type { IntegrationReadyPayload } from '../lib/api';

interface Props {
  payload: IntegrationReadyPayload | null;
  onClose: () => void;
}

export function PayloadModal({ payload, onClose }: Props) {
  if (!payload) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(28,10,0,0.5)' }}>
      <div className="rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col gap-4 shadow-xl"
        style={{ backgroundColor: 'var(--kea-surface)', border: '1px solid var(--kea-border)' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>Payload de Integração</h2>
          <button onClick={onClose} className="btn-ghost text-sm">✕ Fechar</button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <Section title="💳 Asaas — Customer" data={payload.asaas.customer} />
          <Section title="💳 Asaas — Charge"   data={payload.asaas.charge}   />
          <Section title="🤖 Gemini — Prompt"  data={payload.gemini}         />
        </div>
      </div>
    </div>
  );
}

function Section({ title, data }: { title: string; data: object }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label">{title}</span>
      <pre className="rounded-xl p-4 text-xs overflow-x-auto"
        style={{ backgroundColor: 'var(--kea-bg)', border: '1px solid var(--kea-border)', color: 'var(--kea-body)' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
