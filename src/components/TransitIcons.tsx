import React from 'react';
import { BusLoad, BusType } from '../types/bus';

// Double Decker bus silhouette icon
export const DoubleDeckerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Double Decker Bus">
    <rect x="3" y="3" width="18" height="15" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
    <line x1="8" y1="6" x2="11" y2="6" />
    <line x1="13" y1="6" x2="16" y2="6" />
    <line x1="8" y1="13" x2="11" y2="13" />
    <line x1="13" y1="13" x2="16" y2="13" />
  </svg>
);

// Single Deck bus silhouette icon
export const SingleDeckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Single Deck Bus">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <line x1="7" y1="10" x2="10" y2="10" />
    <line x1="14" y1="10" x2="17" y2="10" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

// Bendy Bus silhouette icon
export const BendyBusIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Bendy Bus">
    <rect x="2" y="7" width="9" height="10" rx="1.5" />
    <rect x="13" y="7" width="9" height="10" rx="1.5" />
    <line x1="11" y1="9" x2="13" y2="9" strokeDasharray="1 1" />
    <line x1="11" y1="12" x2="13" y2="12" strokeDasharray="1 1" />
    <line x1="11" y1="15" x2="13" y2="15" strokeDasharray="1 1" />
    <circle cx="5" cy="17" r="1.5" />
    <circle cx="19" cy="17" r="1.5" />
  </svg>
);

// Wheelchair Accessible Bus (WAB) icon
export const WheelchairIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Wheelchair Accessible">
    <circle cx="12" cy="4" r="2" />
    <path d="M5 8h4l2 7h5" />
    <circle cx="14" cy="18" r="4" />
    <path d="M7 16a4 4 0 0 1 4-4" />
  </svg>
);

// Bus crowd load visual meter
export const LoadIndicator: React.FC<{ load: BusLoad; showLabel?: boolean }> = ({ load, showLabel = false }) => {
  const configs = {
    SEA: {
      colorBg: 'bg-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      title: 'Seats Available',
      short: 'Seats Avail',
      bars: 1,
    },
    SDA: {
      colorBg: 'bg-amber-500',
      textColor: 'text-amber-700 dark:text-amber-400',
      title: 'Standing Available',
      short: 'Standing Avail',
      bars: 2,
    },
    LSD: {
      colorBg: 'bg-rose-500',
      textColor: 'text-rose-700 dark:text-rose-400',
      title: 'Limited Standing',
      short: 'Crowded',
      bars: 3,
    },
  };

  const item = configs[load] || configs.SEA;

  return (
    <div className="flex items-center gap-1.5" title={`LTA Load: ${item.title}`}>
      <div className="flex items-end gap-0.5 h-3">
        <span className={`w-1 rounded-xs h-1.5 ${item.bars >= 1 ? item.colorBg : 'bg-slate-200'}`} />
        <span className={`w-1 rounded-xs h-2.5 ${item.bars >= 2 ? item.colorBg : 'bg-slate-200'}`} />
        <span className={`w-1 rounded-xs h-3.5 ${item.bars >= 3 ? item.colorBg : 'bg-slate-200'}`} />
      </div>
      {showLabel && (
        <span className={`text-[11px] font-medium tracking-tight ${item.textColor}`}>
          {item.short}
        </span>
      )}
    </div>
  );
};

export const BusTypeBadge: React.FC<{ type: BusType }> = ({ type }) => {
  if (type === 'DD') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400" title="Double Decker">
        <DoubleDeckerIcon className="w-3.5 h-3.5 text-slate-500" />
        <span>DD</span>
      </span>
    );
  }
  if (type === 'BD') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400" title="Bendy Bus">
        <BendyBusIcon className="w-3.5 h-3.5 text-slate-500" />
        <span>BD</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400" title="Single Deck">
      <SingleDeckIcon className="w-3.5 h-3.5 text-slate-500" />
      <span>SD</span>
    </span>
  );
};
