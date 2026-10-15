import React, { useState } from 'react';
import { BusStop, ServiceArrival, NextBusInfo } from '../types/bus';
import { BusArrivalRow } from './BusArrivalRow';
import { Bookmark, MapPin, Search, ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { LoadIndicator } from './TransitIcons';

interface BusStopDetailViewProps {
  stop: BusStop;
  arrivals: ServiceArrival[];
  isLoading: boolean;
  isSaved: boolean;
  onBack: () => void;
  onToggleSave: (stop: BusStop) => void;
  onRefresh: () => void;
  onViewRoute: (serviceNo: string) => void;
  onTrackOnMap?: (serviceNo: string, bus: NextBusInfo) => void;
}

export const BusStopDetailView: React.FC<BusStopDetailViewProps> = ({
  stop,
  arrivals,
  isLoading,
  isSaved,
  onBack,
  onToggleSave,
  onRefresh,
  onViewRoute,
  onTrackOnMap,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredArrivals = arrivals.filter(a =>
    a.ServiceNo.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-4">
      {/* Top Bar for Stop Details */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Stops</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Refresh Arrival Board"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              onClick={() => onToggleSave(stop)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                isSaved
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved Stop' : 'Save'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-mono text-xs font-bold">
                {stop.BusStopCode}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600 font-medium">{stop.RoadName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {stop.Description}
            </h1>
          </div>
        </div>

        {/* Search input for service number */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by bus number (e.g. 190, 61, 14)..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* LTA Transit Legend */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Crowd Levels:</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Seats Avail</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Standing</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Crowded</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-600">
          <span><strong>DD</strong> Double Deck</span>
          <span><strong>SD</strong> Single Deck</span>
          <span><strong>BD</strong> Bendy</span>
          <span><strong>WAB</strong> Wheelchair</span>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-2.5">
        {filteredArrivals.length > 0 ? (
          filteredArrivals.map((arrival) => (
            <BusArrivalRow
              key={arrival.ServiceNo}
              arrival={arrival}
              onViewRoute={onViewRoute}
              onTrackOnMap={onTrackOnMap}
            />
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <p className="font-medium text-sm text-slate-700">No services match &ldquo;{filterQuery}&rdquo;</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing the search filter</p>
          </div>
        )}
      </div>
    </div>
  );
};
