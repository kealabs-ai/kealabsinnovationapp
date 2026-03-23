import type { QuoteStatus } from '../lib/api';

const map: Record<QuoteStatus, { label: string; cls: string }> = {
  PENDING:  { label: 'Pendente',  cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' },
  APPROVED: { label: 'Aprovado',  cls: 'bg-green-500/10 text-green-400 border border-green-500/30' },
  REJECTED: { label: 'Rejeitado', cls: 'bg-red-500/10 text-red-400 border border-red-500/30' },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const { label, cls } = map[status] ?? map.PENDING;
  return <span className={`badge ${cls}`}>{label}</span>;
}
