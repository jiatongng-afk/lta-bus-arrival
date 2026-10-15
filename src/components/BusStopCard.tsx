import React from 'react';
import { BusStop, ServiceArrival } from '../types/bus';
import { Bookmark, MapPin, ChevronRight, Bus } from 'lucide-react';
import { LoadIndicator } from './TransitIcons';

interface BusStopCardProps {
  stop: BusStop;
  isSelected?: boolean;
  isSaved?: boolean;
  arrivals?: ServiceArrival[];
  onSelect: (stop: BusStop) => void;
  onToggleSave: (stop: BusStop) => void;
  onViewOnMap?: (stop: BusStop) => void;
}

export const BusStopCard: React.FC<BusStopCardProps> = ({
  stop,
  isSelected = false,
  isSaved = false,
  arrivals = [],
  onSelect,
  onToggleSave,
  onViewOnMap,
}) => {
  const topArrivals = arrivals.slice(0, 4);

  const formatCountdown = (seconds: number) => {
    if (seconds <= 30) return 'Arr';
    if (seconds < 60) return '<1m';
    return `${Math.floor(seconds / 60)}m`;
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isSelected
          ? 'bg-emerald-50/40 border-emerald-500 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top Header: Code, Road, Landmark, and Action */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-800 tracking-wider shrink-0">
              <span>{stop.BusStopCode}</span>
            </div>
            
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {stop.Description}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                <span className="truncate">{stop.RoadName}</span>
                {typeof stop.DistanceMeters === 'number' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium whitespace-nowrap">
                      {stop.DistanceMeters < 1000 ? `${stop.DistanceMeters}m` : `${(stop.DistanceMeters / 1000).toFixed(1)}km`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions: Save & Map */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(stop);
              }}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                isSaved
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Remove from Saved' : 'Save Bus Stop'}
              aria-label={isSaved ? 'Remove from Saved' : 'Save Bus Stop'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            
            {onViewOnMap && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOnMap(stop);
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                title="View on Map"
                aria-label="View on Map"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Incoming Buses Snippet */}
        {topArrivals.length > 0 ? (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-medium text-slate-700">Next Incoming Buses</span>
              <button
                onClick={() => onSelect(stop)}
                className="text-emerald-700 hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>All {stop.Services.length} Services</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {topArrivals.map((arrival) => {
                const isArr = arrival.NextBus.EstimatedArrivalSeconds <= 30;
                return (
                  <div
                    key={arrival.ServiceNo}
                    onClick={() => onSelect(stop)}
                    className="cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                        {arrival.ServiceNo}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold tabular-nums ${isArr ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {formatCountdown(arrival.NextBus.EstimatedArrivalSeconds)}
                      </span>
                      <LoadIndicator load={arrival.NextBus.Load} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Bus className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Buses:</span>
              <span className="text-xs text-slate-700 font-medium">
                {stop.Services.slice(0, 8).join(', ')}
                {stop.Services.length > 8 ? ` +${stop.Services.length - 8}` : ''}
              </span>
            </div>

            <button
              onClick={() => onSelect(stop)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0 ml-2"
            >
              <span>View Arrival Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
