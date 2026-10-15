import React from 'react';
import { BusRouteDetails, BusStop } from '../types/bus';
import { X, Clock, Compass, Activity, ChevronRight, Bus } from 'lucide-react';
import { LoadIndicator, BusTypeBadge } from './TransitIcons';

interface RouteVisualizerModalProps {
  route: BusRouteDetails | null;
  onClose: () => void;
  onSelectStop: (busStopCode: string) => void;
}

export const RouteVisualizerModal: React.FC<RouteVisualizerModalProps> = ({
  route,
  onClose,
  onSelectStop,
}) => {
  if (!route) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="route-modal-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-2xl shadow-sm">
              <span>{route.ServiceNo}</span>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-100 uppercase">
                {route.Operator}
              </span>
            </div>

            <div>
              <h2 id="route-modal-title" className="text-lg sm:text-xl font-bold text-slate-900">
                Service {route.ServiceNo} Route Map
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {route.Origin} <span className="text-slate-400">→</span> {route.Destination}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Stats & Operating Schedule */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-white border-b border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Operating Hours</span>
            </div>
            <div className="font-semibold text-slate-800">
              {route.OperatingHours.weekday}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Frequency</span>
            </div>
            <div className="font-semibold text-slate-800">
              Peak {route.FrequencyMins.peak}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Active Buses</span>
            </div>
            <div className="font-semibold text-emerald-700">
              {route.ActiveBuses.length} tracked on route
            </div>
          </div>
        </div>

        {/* Interactive Linear Route Stops Diagram */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Route Stops Sequence ({route.Stops.length} stops)
          </div>

          <div className="relative pl-6 sm:pl-8">
            {/* The vertical transit line */}
            <div className="absolute left-[11px] sm:left-[15px] top-3 bottom-3 w-1 bg-emerald-500/30 rounded-full" />

            {route.Stops.map((stop, index) => {
              const activeBusHere = route.ActiveBuses.find(
                b => b.currentStopCode === stop.BusStopCode || b.nextStopCode === stop.BusStopCode
              );

              return (
                <div key={stop.BusStopCode} className="relative pb-6 last:pb-0 group">
                  {/* Stop node circle */}
                  <div className={`absolute -left-6 sm:-left-8 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white transition-transform ${
                    activeBusHere
                      ? 'bg-emerald-600 ring-4 ring-emerald-100 scale-125'
                      : 'bg-slate-400 group-hover:bg-emerald-500'
                  }`} />

                  {/* Stop content row */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                    <button
                      onClick={() => {
                        onSelectStop(stop.BusStopCode);
                        onClose();
                      }}
                      className="text-left flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-emerald-700">
                          {stop.BusStopCode}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{stop.RoadName}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {stop.Description}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {stop.DistanceKm} km from terminal
                      </div>
                    </button>

                    {/* Active Bus Marker if bus is approaching this stop */}
                    {activeBusHere ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <Bus className="w-4 h-4 text-emerald-700 animate-pulse" />
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-bold text-emerald-800">
                            ~{activeBusHere.nextArrivalMins} min
                          </span>
                          <div className="flex items-center gap-1 justify-end">
                            <BusTypeBadge type={activeBusHere.type} />
                            <LoadIndicator load={activeBusHere.load} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectStop(stop.BusStopCode);
                          onClose();
                        }}
                        className="text-xs font-semibold text-slate-500 group-hover:text-emerald-700 flex items-center gap-1"
                      >
                        <span>Arrivals</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Official LTA Singapore Transit Network Schedule</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
