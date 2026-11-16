import { TREND_LABEL, type TrendKind } from '../domain/trend';

const STYLE: Record<TrendKind, { cls: string; icon: string }> = {
  ruecklaeufig: { cls: 'bg-teal-50 text-teal-800 ring-teal-200', icon: '↘' },
  stabil: { cls: 'bg-sky-50 text-sky-800 ring-sky-200', icon: '→' },
  zunehmend: { cls: 'bg-amber-50 text-amber-900 ring-amber-200', icon: '↗' },
  offen: { cls: 'bg-slate-100 text-slate-600 ring-slate-200', icon: '•' },
};

export function TrendBadge({ kind, large = false }: { kind: TrendKind; large?: boolean }) {
  const s = STYLE[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ring-1 ring-inset ${s.cls} ${
        large ? 'px-4 py-1.5 text-base' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span aria-hidden="true">{s.icon}</span>
      {TREND_LABEL[kind]}
    </span>
  );
}
