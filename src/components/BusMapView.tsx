import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BusStop, ActiveBusPosition, BusRouteDetails } from '../types/bus';
import { SINGAPORE_LOCATIONS } from '../data/singaporeBusData';
import { Crosshair, Layers, Navigation } from 'lucide-react';

interface BusMapViewProps {
  stops: BusStop[];
  selectedStop?: BusStop | null;
  activeRoute?: BusRouteDetails | null;
  activeBuses?: ActiveBusPosition[];
  userLocation: { lat: number; lng: number };
  onSelectStop: (stop: BusStop) => void;
  onSelectLocationPreset?: (loc: { lat: number; lng: number; name: string }) => void;
  onLocateMe?: () => void;
}

export const BusMapView: React.FC<BusMapViewProps> = ({
  stops,
  selectedStop,
  activeRoute,
  activeBuses = [],
  userLocation,
  onSelectStop,
  onSelectLocationPreset,
  onLocateMe,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = selectedStop?.Latitude || userLocation.lat || 1.2995;
    const initialLng = selectedStop?.Longitude || userLocation.lng || 103.8552;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
    });

    // Add crisp CartoDB Positron tiles for high-end modern transport map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location beacon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; items-center; justify-content: center;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background: rgba(16, 185, 129, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 9999px; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map);
  }, [userLocation]);

  // Update bus stops and live bus markers on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Render Bus Stops
    stops.forEach((stop) => {
      const isSelected = selectedStop?.BusStopCode === stop.BusStopCode;
      
      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            background: ${isSelected ? '#059669' : '#ffffff'};
            color: ${isSelected ? '#ffffff' : '#0f172a'};
            border: 2.5px solid ${isSelected ? '#ffffff' : '#059669'};
            border-radius: 9999px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <svg width="${isSelected ? '16' : '13'}" height="${isSelected ? '16' : '13'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
              <path d="M4 11h16" />
              <circle cx="7.5" cy="18.5" r="1.5" />
              <circle cx="16.5" cy="18.5" r="1.5" />
            </svg>
          </div>
        `,
        iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
        iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
      });

      const marker = L.marker([stop.Latitude, stop.Longitude], {
        icon: stopIcon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.on('click', () => {
        onSelectStop(stop);
      });

      // Quick popup
      marker.bindPopup(`
        <div style="padding: 12px 14px; min-width: 190px;">
          <div style="font-size: 11px; font-weight: 700; color: #059669; font-family: monospace;">STOP ${stop.BusStopCode}</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${stop.Description}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 1px;">${stop.RoadName}</div>
          <div style="margin-top: 8px; font-size: 11px; color: #334155; line-height: 1.3;">
            <strong>Services:</strong> ${stop.Services.slice(0, 6).join(', ')}${stop.Services.length > 6 ? '...' : ''}
          </div>
        </div>
      `);

      markersGroup.addLayer(marker);
    });

    // 2. Render Live Moving Bus Fleet
    activeBuses.forEach((bus) => {
      const busIcon = L.divIcon({
        className: 'custom-live-bus-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 7px;
            background: #0f172a;
            color: #ffffff;
            border-radius: 9999px;
            border: 2px solid #10b981;
            font-size: 11px;
            font-weight: 800;
            font-family: inherit;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
            cursor: pointer;
            white-space: nowrap;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
              <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
              <path d="M4 11h16" />
            </svg>
            <span>${bus.serviceNo}</span>
          </div>
        `,
        iconSize: [52, 24],
        iconAnchor: [26, 12],
      });

      const busMarker = L.marker([bus.latitude, bus.longitude], {
        icon: busIcon,
        zIndexOffset: 800,
      });

      busMarker.bindPopup(`
        <div style="padding: 10px 12px; font-size: 12px;">
          <div style="font-weight: 700; color: #0f172a;">Live Bus: Service ${bus.serviceNo} (${bus.operator})</div>
          <div style="color: #64748b; margin-top: 2px;">Speed: ${bus.speed} km/h · Type: ${bus.type} (${bus.feature})</div>
          <div style="color: #059669; font-weight: 600; margin-top: 4px;">ETA Next Stop: ~${bus.nextArrivalMins} min</div>
        </div>
      `);

      markersGroup.addLayer(busMarker);
    });

    // 3. Render Route Polyline if activeRoute is specified
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (activeRoute && activeRoute.Stops.length > 1) {
      const latlngs: [number, number][] = activeRoute.Stops.map(s => [s.Latitude, s.Longitude]);
      const polyline = L.polyline(latlngs, {
        color: '#059669',
        weight: 4,
        opacity: 0.8,
        dashArray: '2, 6',
      }).addTo(map);

      routeLayerRef.current = polyline;
    }
  }, [stops, selectedStop, activeRoute, activeBuses, onSelectStop]);

  // Center on selected stop
  useEffect(() => {
    if (!selectedStop || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([selectedStop.Latitude, selectedStop.Longitude], 16, {
      animate: true,
    });
  }, [selectedStop]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {/* The Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Transit Hub Location Presets */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {SINGAPORE_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([loc.lat, loc.lng], 15, { animate: true });
              }
              onSelectLocationPreset?.(loc);
            }}
            className="px-2.5 py-1.5 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-emerald-700 shadow-xs whitespace-nowrap shrink-0 transition-colors"
          >
            {loc.name.split('/')[0].trim()}
          </button>
        ))}
      </div>

      {/* Locate Me Floating Button */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
            }
            onLocateMe?.();
          }}
          className="min-h-[44px] px-3.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 shadow-sm flex items-center gap-2 transition-colors"
          title="Center on My Location"
        >
          <Crosshair className="w-4 h-4 text-emerald-600" />
          <span>My Location</span>
        </button>

        {activeRoute && (
          <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tracking Service {activeRoute.ServiceNo}</span>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="hidden sm:flex absolute bottom-4 right-16 z-20 items-center gap-3 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 text-[11px] text-slate-600 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white" />
          <span>Bus Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-2 rounded-xs bg-slate-900 border border-emerald-400" />
          <span>Live Bus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>You</span>
        </div>
      </div>
    </div>
  );
};
