import React, { useState } from 'react';
import { SavedStopItem, BusStop, ServiceArrival } from '../types/bus';
import { Bookmark, Trash2, ChevronRight, Bus, Plus } from 'lucide-react';

interface SavedStopsViewProps {
  savedStops: SavedStopItem[];
  allStops: BusStop[];
  onSelectStop: (stop: BusStop) => void;
  onRemoveSaved: (code: string) => void;
  onBrowseNearby: () => void;
}

export const SavedStopsView: React.FC<SavedStopsViewProps> = ({
  savedStops,
  allStops,
  onSelectStop,
  onRemoveSaved,
  onBrowseNearby,
}) => {
  const [filterTag, setFilterTag] = useState<'All' | 'Home' | 'Work' | 'Frequent'>('All');

  const filtered = filterTag === 'All' 
    ? savedStops 
    : savedStops.filter(s => s.tag === filterTag);

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-3 p-1.5 bg-slate-100 rounded-xl">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['All', 'Frequent', 'Work', 'Home'] as const).map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterTag === tag
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <button
          onClick={onBrowseNearby}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0 px-2.5 py-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Stop</span>
        </button>
      </div>

      {/* List of Saved Stops */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const stopObj = allStops.find(s => s.BusStopCode === item.busStopCode);

            return (
              <div
                key={item.busStopCode}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex items-center justify-between gap-3"
              >
                <div
                  onClick={() => stopObj && onSelectStop(stopObj)}
                  className="cursor-pointer flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-800">
                      {item.busStopCode}
                    </span>
                    {item.tag && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {item.tag}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 truncate">{item.roadName}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {item.description}
                  </h3>

                  {item.pinnedServices && item.pinnedServices.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-xs text-slate-400 font-medium">Daily Buses:</span>
                      {item.pinnedServices.map(svc => (
                        <span key={svc} className="text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {svc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onRemoveSaved(item.busStopCode)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Remove from Saved"
                    aria-label="Remove from Saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => stopObj && onSelectStop(stopObj)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="View Arrivals"
                    aria-label="View Arrivals"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Saved Commutes Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Bookmark your daily bus stops (Home, Office, MRT interchanges) to check live arrivals instantly before stepping out.
          </p>
          <button
            onClick={onBrowseNearby}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Browse Singapore Bus Stops
          </button>
        </div>
      )}
    </div>
  );
};
