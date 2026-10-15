import React from 'react';
import { Map, Bookmark, Route, Sliders, RefreshCw, Compass } from 'lucide-react';

interface HeaderProps {
  activeTab: 'nearby' | 'saved' | 'routes' | 'map';
  onSelectTab: (tab: 'nearby' | 'saved' | 'routes' | 'map') => void;
  onOpenApiConfig: () => void;
  onRefreshArrivals: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenApiConfig,
  onRefreshArrivals,
  isRefreshing = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-16">
        {/* Zone 1: Brand Wordmark (Single element) */}
        <button 
          onClick={() => onSelectTab('nearby')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6v6" />
              <path d="M16 6v6" />
              <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
              <path d="M4 11h16" />
              <circle cx="7.5" cy="18.5" r="1.5" />
              <circle cx="16.5" cy="18.5" r="1.5" />
            </svg>
          </div>
          <span>SG BusLive</span>
        </button>

        {/* Zone 2: 4 Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('nearby')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
              activeTab === 'nearby' 
                ? 'text-emerald-700 border-emerald-600 font-semibold' 
                : 'text-slate-600 hover:text-slate-950 border-transparent'
            }`}
          >
            Nearby Stops
          </button>
          <button
            onClick={() => onSelectTab('saved')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
              activeTab === 'saved' 
                ? 'text-emerald-700 border-emerald-600 font-semibold' 
                : 'text-slate-600 hover:text-slate-950 border-transparent'
            }`}
          >
            Saved Commutes
          </button>
          <button
            onClick={() => onSelectTab('routes')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
              activeTab === 'routes' 
                ? 'text-emerald-700 border-emerald-600 font-semibold' 
                : 'text-slate-600 hover:text-slate-950 border-transparent'
            }`}
          >
            Route Radar
          </button>
          <button
            onClick={onOpenApiConfig}
            className="whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-950 transition-colors flex items-center gap-1.5"
          >
            <span>LTA Settings</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefreshArrivals}
            title="Refresh Bus Arrivals"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => onSelectTab(activeTab === 'map' ? 'nearby' : 'map')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'map'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>{activeTab === 'map' ? 'Stop List' : 'Live Map'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
