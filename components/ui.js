// ─── Design system tokens & reusable primitives ───────────────────────────────
import { useState, useEffect, useRef } from 'react';

// ── Status ────────────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  client:    { label: 'Client',    badge: 'bg-blue-50 text-blue-600',       dot: 'bg-blue-500',    ring: 'ring-blue-200',    color: 'bg-blue-500',    active: 'bg-blue-50 text-blue-600 border-blue-200',    text: 'text-blue-600' },
  agreed:    { label: 'Agreed',    badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', ring: 'ring-emerald-200', color: 'bg-emerald-500', active: 'bg-emerald-50 text-emerald-600 border-emerald-200', text: 'text-emerald-600' },
  contacted: { label: 'Contacted', badge: 'bg-amber-50 text-amber-600',     dot: 'bg-amber-400',   ring: 'ring-amber-200',   color: 'bg-amber-400',   active: 'bg-amber-50 text-amber-600 border-amber-200',  text: 'text-amber-600' },
  rejected:  { label: 'Rejected',  badge: 'bg-red-50 text-red-500',         dot: 'bg-red-500',     ring: 'ring-red-200',     color: 'bg-red-500',     active: 'bg-red-50 text-red-500 border-red-200',        text: 'text-red-500' },
  untouched: { label: 'Untouched', badge: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400',    ring: 'ring-gray-200',    color: 'bg-gray-400',    active: 'bg-gray-100 text-gray-700 border-gray-300',    text: 'text-gray-500' },
};

// Pill badge — map info cards, add form toggle
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['untouched'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// Dot + colored text — tables, lists (no background)
export function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['untouched'];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <span className={`text-[13px] font-medium ${cfg.text}`}>{cfg.label}</span>
    </span>
  );
}

// ── Layout primitives ─────────────────────────────────────────────────────────

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ── Form elements ─────────────────────────────────────────────────────────────

export const inputCls =
  'w-full px-3.5 py-2.5 text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent focus:bg-white placeholder-gray-400 transition hover:border-gray-300';

export const selectCls =
  'text-[13px] text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-[7px] outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent cursor-pointer transition hover:border-gray-300';

// ── Buttons ───────────────────────────────────────────────────────────────────

// Dark primary — main CTA across all dashboard pages
export function BtnPrimary({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 active:bg-black text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Outlined secondary
export function BtnSecondary({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Status filter dropdown (replaces native <select> for statuses) ────────────
const STATUS_DOT_COLORS = {
  client:    'bg-blue-500',
  agreed:    'bg-emerald-500',
  contacted: 'bg-amber-400',
  rejected:  'bg-red-500',
  untouched: 'bg-gray-400',
};
const STATUS_OPTION_STYLES = {
  client:    'text-blue-600 hover:bg-blue-50',
  agreed:    'text-emerald-600 hover:bg-emerald-50',
  contacted: 'text-amber-600 hover:bg-amber-50',
  rejected:  'text-red-500 hover:bg-red-50',
  untouched: 'text-gray-600 hover:bg-gray-50',
};

export function StatusSelect({ value, onChange, statuses = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selectedCfg = value ? STATUS_CONFIG[value] : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-[13px] bg-white border border-gray-200 rounded-lg px-3 py-[7px] outline-none cursor-pointer transition hover:border-gray-300 whitespace-nowrap select-none"
      >
        {selectedCfg ? (
          <>
            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[value]}`} />
            <span className={`font-medium ${STATUS_OPTION_STYLES[value].split(' ')[0]}`}>{selectedCfg.label}</span>
          </>
        ) : (
          <span className="text-gray-500">All statuses</span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[160px] overflow-hidden">
          {/* All statuses option */}
          <button
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors text-left ${!value ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            All statuses
          </button>

          <div className="my-1 border-t border-gray-100" />

          {statuses.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = value === s;
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors text-left ${isActive ? `${cfg.badge}` : STATUS_OPTION_STYLES[s]}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[s]}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Ghost / text-only
export function BtnGhost({ children, className = '', ...props }) {
  return (
    <button
      className={`text-[13px] text-gray-400 hover:text-gray-700 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
