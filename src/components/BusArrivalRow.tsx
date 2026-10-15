import React from 'react';
import { ServiceArrival, NextBusInfo } from '../types/bus';
import { LoadIndicator, BusTypeBadge, WheelchairIcon } from './TransitIcons';
import { MapPin, Navigation } from 'lucide-react';

interface BusArrivalRowProps {
  arrival: ServiceArrival;
  onViewRoute?: (serviceNo: string) => void;
  onTrackOnMap?: (serviceNo: string, bus: NextBusInfo) => void;
}

export const BusArrivalRow: React.FC<BusArrivalRowProps> = ({
  arrival,
  onViewRoute,
  onTrackOnMap,
}) => {
  const formatCountdown = (seconds: number) => {
    if (seconds <= 30) return { label: 'Arr', isArriving: true };
    if (seconds < 60) return { label: '<1m', isArriving: false };
    const mins = Math.floor(seconds / 60);
    return { label: `${mins}m`, isArriving: false };
  };

  const formatExactTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  const renderArrivalBadge = (bus?: NextBusInfo, rank: number = 1) => {
    if (!bus || !bus.EstimatedArrival) {
      return (
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 min-w-[76px] h-[68px] opacity-40">
          <span className="text-xs text-slate-400 font-medium">--</span>
          <span className="text-[10px] text-slate-400">No data</span>
        </div>
      );
    }

    const { label, isArriving } = formatCountdown(bus.EstimatedArrivalSeconds);
    const exactTime = formatExactTime(bus.EstimatedArrival);

    return (
      <div 
        className={`flex flex-col items-center justify-between p-2 rounded-xl border min-w-[80px] sm:min-w-[92px] h-[68px] transition-all ${
          rank === 1
            ? isArriving
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] tabular-nums font-mono text-slate-600">
            {exactTime}
          </span>
          {bus.Feature === 'WAB' && (
            <span title="Wheelchair Accessible">
              <WheelchairIcon className="w-3 h-3 text-slate-600" />
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1 my-0.5">
          <span className={`text-base sm:text-lg font-bold tabular-nums tracking-tight ${
            isArriving ? 'text-emerald-700 animate-pulse' : 'text-slate-900'
          }`}>
            {label}
          </span>
        </div>

        <div className="flex items-center justify-between w-full pt-1 border-t border-slate-100">
          <BusTypeBadge type={bus.Type} />
          <LoadIndicator load={bus.Load} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors gap-3">
      {/* Service badge and metadata */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onViewRoute?.(arrival.ServiceNo)}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-emerald-700 transition-colors shadow-xs group"
          title={`Click to inspect Route ${arrival.ServiceNo}`}
        >
          <span>{arrival.ServiceNo}</span>
          <span className="text-[9px] font-normal tracking-wider text-slate-300 group-hover:text-emerald-100 uppercase">
            {arrival.Operator}
          </span>
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              Service {arrival.ServiceNo}
            </span>
            <span className="text-xs text-slate-600">
              · {arrival.Operator}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
            <button
              onClick={() => onViewRoute?.(arrival.ServiceNo)}
              className="text-emerald-700 hover:underline font-medium flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              <span>Full Route</span>
            </button>
            {arrival.NextBus.Latitude > 0 && onTrackOnMap && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => onTrackOnMap(arrival.ServiceNo, arrival.NextBus)}
                  className="text-slate-600 hover:text-slate-950 font-medium flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Locate Bus</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3 Arrival Prediction Badges */}
      <div className="flex items-center gap-2 self-end sm:self-auto overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto justify-end">
        {renderArrivalBadge(arrival.NextBus, 1)}
        {renderArrivalBadge(arrival.NextBus2, 2)}
        {renderArrivalBadge(arrival.NextBus3, 3)}
      </div>
    </div>
  );
};
