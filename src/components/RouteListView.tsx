import React, { useState } from 'react';
import { BusRouteDetails } from '../types/bus';
import { DETAILED_ROUTES } from '../data/singaporeBusData';
import { Search, Navigation, Compass, ChevronRight, Bus } from 'lucide-react';

interface RouteListViewProps {
  onSelectRoute: (serviceNo: string) => void;
  onTrackRouteOnMap: (serviceNo: string) => void;
}

export const RouteListView: React.FC<RouteListViewProps> = ({
  onSelectRoute,
  onTrackRouteOnMap,
}) => {
  const [search, setSearch] = useState('');

  const routesList = Object.values(DETAILED_ROUTES);

  const filteredRoutes = routesList.filter(r =>
    r.ServiceNo.toLowerCase().includes(search.toLowerCase().trim()) ||
    r.Origin.toLowerCase().includes(search.toLowerCase().trim()) ||
    r.Destination.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Singapore Bus Route Radar &amp; Fleet Tracker
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Explore complete stop itineraries, schedules, and live vehicle positions along trunk lines
        </p>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search service number or destination (e.g. 190, Bugis, Orchard, Clementi)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredRoutes.map((route) => (
          <div
            key={route.ServiceNo}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg flex flex-col items-center justify-center shrink-0">
                    <span>{route.ServiceNo}</span>
                    <span className="text-[8px] font-medium text-emerald-400 uppercase tracking-wider">
                      {route.Operator}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {route.Category} Service
                    </span>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {route.Origin} <span className="text-slate-400">⇄</span> {route.Destination}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <span>Frequency: {route.FrequencyMins.peak}</span>
                <span aria-hidden="true">·</span>
                <span>{route.Stops.length} stops</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Bus className="w-3.5 h-3.5" />
                  <span>{route.ActiveBuses.length} Live Buses</span>
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onTrackRouteOnMap(route.ServiceNo)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-slate-600" />
                <span>Track on Map</span>
              </button>

              <button
                onClick={() => onSelectRoute(route.ServiceNo)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white flex items-center gap-1 transition-colors shadow-xs"
              >
                <span>View Route</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
