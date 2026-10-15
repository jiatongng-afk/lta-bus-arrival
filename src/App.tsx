import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BusService } from './services/busService';
import { BusStop, ServiceArrival, BusRouteDetails, SavedStopItem, LtaApiConfig, NextBusInfo } from './types/bus';
import { Header } from './components/Header';
import { BusStopCard } from './components/BusStopCard';
import { BusStopDetailView } from './components/BusStopDetailView';
import { BusMapView } from './components/BusMapView';
import { RouteVisualizerModal } from './components/RouteVisualizerModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { SavedStopsView } from './components/SavedStopsView';
import { RouteListView } from './components/RouteListView';
import { SINGAPORE_LOCATIONS } from './data/singaporeBusData';
import { 
  Search, 
  MapPin, 
  Compass, 
  Bookmark, 
  Route, 
  RefreshCw, 
  Map as MapIcon, 
  ListFilter,
  SlidersHorizontal,
  ChevronDown,
  Navigation
} from 'lucide-react';

export default function App() {
  const busService = useMemo(() => BusService.getInstance(), []);

  // Main navigation & view state
  const [activeTab, setActiveTab] = useState<'nearby' | 'saved' | 'routes' | 'map'>('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  
  // Selected bus stop for arrival board
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [currentArrivals, setCurrentArrivals] = useState<ServiceArrival[]>([]);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Route modal & active tracking
  const [inspectedRoute, setInspectedRoute] = useState<BusRouteDetails | null>(null);
  const [activeMapRoute, setActiveMapRoute] = useState<BusRouteDetails | null>(null);

  // User location (defaults to Bugis, Singapore)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 1.2995,
    lng: 103.8552,
  });
  const [currentLocationName, setCurrentLocationName] = useState<string>('Bugis / Victoria St');

  // Bookmarks / Saved stops
  const [savedStops, setSavedStops] = useState<SavedStopItem[]>([]);

  // API Config modal
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
  const [apiConfig, setApiConfig] = useState<LtaApiConfig>(busService.getApiConfig());

  // Load initial saved stops
  useEffect(() => {
    setSavedStops(busService.getSavedStops());
  }, [busService]);

  // Request browser geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Check if coordinates are in Singapore bounding box roughly [1.15 to 1.48, 103.55 to 104.05]
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (lat >= 1.15 && lat <= 1.48 && lng >= 103.55 && lng <= 104.05) {
            setUserLocation({ lat, lng });
            setCurrentLocationName('Current GPS Location');
          }
        },
        () => {
          // Geolocation denied or out of range, default location remains active
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Compute nearby stops relative to current userLocation
  const nearbyStops = useMemo(() => {
    const rawNearby = busService.getNearbyBusStops(userLocation.lat, userLocation.lng, 15000);
    return rawNearby;
  }, [busService, userLocation]);

  // Filtered stops for search & zone
  const displayedStops = useMemo(() => {
    let list = busService.searchBusStops(searchQuery);

    if (selectedZone !== 'All') {
      list = list.filter(s => s.Zone === selectedZone);
    }

    // Attach distances
    return list.map(stop => {
      const match = nearbyStops.find(n => n.BusStopCode === stop.BusStopCode);
      return {
        ...stop,
        DistanceMeters: match?.DistanceMeters,
      };
    }).sort((a, b) => (a.DistanceMeters ?? 99999) - (b.DistanceMeters ?? 99999));
  }, [busService, searchQuery, selectedZone, nearbyStops]);

  // Fetch arrivals when selectedStop changes
  const loadArrivalsForStop = useCallback(async (stopCode: string) => {
    setIsLoadingArrivals(true);
    try {
      const res = await busService.getBusArrivals(stopCode);
      setCurrentArrivals(res.services);
      setLastRefreshedAt(new Date(res.timestamp));
    } catch (err) {
      console.error('Failed to load bus arrivals:', err);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, [busService]);

  useEffect(() => {
    if (selectedStop) {
      loadArrivalsForStop(selectedStop.BusStopCode);
    }
  }, [selectedStop, loadArrivalsForStop]);

  // Live second-by-second countdown tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentArrivals(prev =>
        prev.map(item => ({
          ...item,
          NextBus: {
            ...item.NextBus,
            EstimatedArrivalSeconds: Math.max(0, item.NextBus.EstimatedArrivalSeconds - 1),
          },
          NextBus2: item.NextBus2 ? {
            ...item.NextBus2,
            EstimatedArrivalSeconds: Math.max(0, item.NextBus2.EstimatedArrivalSeconds - 1),
          } : undefined,
          NextBus3: item.NextBus3 ? {
            ...item.NextBus3,
            EstimatedArrivalSeconds: Math.max(0, item.NextBus3.EstimatedArrivalSeconds - 1),
          } : undefined,
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Periodic automatic re-sync (every 25 seconds)
  useEffect(() => {
    const intervalMs = (apiConfig.autoRefreshIntervalSeconds || 25) * 1000;
    const interval = setInterval(() => {
      if (selectedStop) {
        loadArrivalsForStop(selectedStop.BusStopCode);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [selectedStop, apiConfig, loadArrivalsForStop]);

  // Handlers
  const handleSelectStop = (stop: BusStop) => {
    setSelectedStop(stop);
  };

  const handleToggleSaveStop = (stop: BusStop) => {
    if (busService.isStopSaved(stop.BusStopCode)) {
      busService.removeSavedStop(stop.BusStopCode);
    } else {
      busService.saveStop(stop, 'Frequent');
    }
    setSavedStops(busService.getSavedStops());
  };

  const handleInspectRoute = (serviceNo: string) => {
    const route = busService.getRouteDetails(serviceNo);
    if (route) {
      setInspectedRoute(route);
    }
  };

  const handleTrackRouteOnMap = (serviceNo: string) => {
    const route = busService.getRouteDetails(serviceNo);
    if (route) {
      setActiveMapRoute(route);
      setActiveTab('map');
      if (route.Stops.length > 0) {
        const firstStop = busService.getBusStopByCode(route.Stops[0].BusStopCode);
        if (firstStop) {
          setSelectedStop(firstStop);
        }
      }
    }
  };

  const handleSelectLocationPreset = (loc: { lat: number; lng: number; name: string }) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng });
    setCurrentLocationName(loc.name);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });
          setCurrentLocationName('Current GPS Location');
        },
        () => {
          // fallback to Bugis
          setUserLocation({ lat: 1.2995, lng: 103.8552 });
          setCurrentLocationName('Bugis / Victoria St');
        }
      );
    }
  };

  const isStopSaved = useCallback((code: string) => {
    return savedStops.some(s => s.busStopCode === code);
  }, [savedStops]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-8">
      {/* Top Bar Contract (Header) */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'map') {
            setActiveMapRoute(null);
          }
        }}
        onOpenApiConfig={() => setIsApiConfigOpen(true)}
        onRefreshArrivals={() => {
          if (selectedStop) {
            loadArrivalsForStop(selectedStop.BusStopCode);
          }
        }}
        isRefreshing={isLoadingArrivals}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 flex-1 flex flex-col">
        {/* Active Hub / Location Simulator Bar */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Location:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLocationName}</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-mono text-[11px]">
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Switch Hub:</span>
            {SINGAPORE_LOCATIONS.slice(0, 4).map(loc => (
              <button
                key={loc.name}
                onClick={() => handleSelectLocationPreset(loc)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  currentLocationName === loc.name
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {loc.name.split('/')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* View Switcher: Map View vs Tab Content */}
        {activeTab === 'map' ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[550px]">
            {/* Map Canvas */}
            <div className="lg:col-span-8 h-[450px] lg:h-auto min-h-[420px]">
              <BusMapView
                stops={displayedStops}
                selectedStop={selectedStop}
                activeRoute={activeMapRoute}
                activeBuses={activeMapRoute?.ActiveBuses}
                userLocation={userLocation}
                onSelectStop={handleSelectStop}
                onSelectLocationPreset={handleSelectLocationPreset}
                onLocateMe={handleLocateMe}
              />
            </div>

            {/* Sidebar Arrival Details */}
            <div className="lg:col-span-4 flex flex-col space-y-4 overflow-y-auto max-h-[680px]">
              {selectedStop ? (
                <BusStopDetailView
                  stop={selectedStop}
                  arrivals={currentArrivals}
                  isLoading={isLoadingArrivals}
                  isSaved={isStopSaved(selectedStop.BusStopCode)}
                  onBack={() => setSelectedStop(null)}
                  onToggleSave={handleToggleSaveStop}
                  onRefresh={() => loadArrivalsForStop(selectedStop.BusStopCode)}
                  onViewRoute={handleInspectRoute}
                  onTrackOnMap={(svc) => handleTrackRouteOnMap(svc)}
                />
              ) : (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Select a Singapore Bus Stop</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Click any bus stop pin on the map to inspect live arrivals, crowd levels, and vehicle fleet positions.
                  </p>
                  <div className="mt-4 w-full text-left">
                    <span className="text-xs font-semibold text-slate-600 block mb-2">Nearby Stops:</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {nearbyStops.slice(0, 5).map(s => (
                        <button
                          key={s.BusStopCode}
                          onClick={() => setSelectedStop(s)}
                          className="w-full text-left p-2 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-800">{s.BusStopCode}</span>
                            <span className="text-slate-600 ml-1.5 font-medium">{s.Description}</span>
                          </div>
                          <span className="text-emerald-700 font-semibold">{s.DistanceMeters}m</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'saved' ? (
          <SavedStopsView
            savedStops={savedStops}
            allStops={busService.getAllBusStops()}
            onSelectStop={(stop) => {
              setSelectedStop(stop);
              setActiveTab('nearby');
            }}
            onRemoveSaved={(code) => {
              busService.removeSavedStop(code);
              setSavedStops(busService.getSavedStops());
            }}
            onBrowseNearby={() => setActiveTab('nearby')}
          />
        ) : activeTab === 'routes' ? (
          <RouteListView
            onSelectRoute={handleInspectRoute}
            onTrackRouteOnMap={handleTrackRouteOnMap}
          />
        ) : (
          /* 'nearby' Tab: Main Bus Stop List & Arrival Board */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
            {/* Left Column: Search & Stops List */}
            <div className={`space-y-4 ${selectedStop ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              {/* Search Bar & Filters */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search 5-digit stop code, road, landmark, or bus # (e.g. 01012, Bugis, Victoria St, 190)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Zone Segmented Filter */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 pb-0.5">
                  <div className="flex items-center gap-1">
                    {(['All', 'Central', 'East', 'West', 'North'] as const).map((zone) => (
                      <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          selectedZone === zone
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-600 font-medium whitespace-nowrap shrink-0">
                    {displayedStops.length} stops found
                  </span>
                </div>
              </div>

              {/* Stop Cards List */}
              <div className="space-y-3">
                {displayedStops.length > 0 ? (
                  displayedStops.map((stop) => (
                    <BusStopCard
                      key={stop.BusStopCode}
                      stop={stop}
                      isSelected={selectedStop?.BusStopCode === stop.BusStopCode}
                      isSaved={isStopSaved(stop.BusStopCode)}
                      onSelect={handleSelectStop}
                      onToggleSave={handleToggleSaveStop}
                      onViewOnMap={(s) => {
                        setSelectedStop(s);
                        setActiveTab('map');
                      }}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                    <p className="font-bold text-sm text-slate-800">No Singapore bus stops found</p>
                    <p className="text-xs text-slate-500 mt-1">Try searching for a different code or service.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Active Stop Arrival Details */}
            {selectedStop && (
              <div className="lg:col-span-7">
                <div className="sticky top-20">
                  <BusStopDetailView
                    stop={selectedStop}
                    arrivals={currentArrivals}
                    isLoading={isLoadingArrivals}
                    isSaved={isStopSaved(selectedStop.BusStopCode)}
                    onBack={() => setSelectedStop(null)}
                    onToggleSave={handleToggleSaveStop}
                    onRefresh={() => loadArrivalsForStop(selectedStop.BusStopCode)}
                    onViewRoute={handleInspectRoute}
                    onTrackOnMap={(svc) => handleTrackRouteOnMap(svc)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Route Visualizer Drawer / Modal */}
      <RouteVisualizerModal
        route={inspectedRoute}
        onClose={() => setInspectedRoute(null)}
        onSelectStop={(code) => {
          const stop = busService.getBusStopByCode(code);
          if (stop) {
            setSelectedStop(stop);
            setActiveTab('nearby');
          }
        }}
      />

      {/* LTA DataMall API Configuration Modal */}
      <ApiConfigModal
        config={apiConfig}
        isOpen={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
        onSave={(newConfig) => {
          busService.saveApiConfig(newConfig);
          setApiConfig(newConfig);
        }}
      />

      {/* Fixed Bottom Tab Bar for Mobile Ergonomics (<md) */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-4 items-center h-14">
          <button
            onClick={() => {
              setActiveTab('nearby');
              setActiveMapRoute(null);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'nearby' ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Nearby</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'saved' ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Saved</span>
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'routes' ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Route className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Routes</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'map' ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Map</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
