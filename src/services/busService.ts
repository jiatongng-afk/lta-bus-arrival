import { 
  BusStop, 
  ServiceArrival, 
  NextBusInfo, 
  BusRouteDetails, 
  LtaApiConfig, 
  SavedStopItem, 
  BusLoad, 
  BusType, 
  BusFeature 
} from '../types/bus';
import { 
  SINGAPORE_BUS_STOPS, 
  DETAILED_ROUTES, 
  getServiceOperator, 
  calculateDistanceMeters 
} from '../data/singaporeBusData';

const STORAGE_KEY_SAVED_STOPS = 'sg_bus_saved_stops_v1';
const STORAGE_KEY_API_CONFIG = 'sg_bus_api_config_v1';

export class BusService {
  private static instance: BusService;
  private apiConfig: LtaApiConfig;

  private constructor() {
    this.apiConfig = this.loadApiConfig();
  }

  public static getInstance(): BusService {
    if (!BusService.instance) {
      BusService.instance = new BusService();
    }
    return BusService.instance;
  }

  // Load / Save API configuration
  public getApiConfig(): LtaApiConfig {
    return this.apiConfig;
  }

  public saveApiConfig(config: LtaApiConfig): void {
    this.apiConfig = config;
    try {
      localStorage.setItem(STORAGE_KEY_API_CONFIG, JSON.stringify(config));
    } catch {
      // storage unavailable
    }
  }

  private loadApiConfig(): LtaApiConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_API_CONFIG);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {
      accountKey: '',
      useLiveData: false,
      proxyUrl: '',
      autoRefreshIntervalSeconds: 20,
    };
  }

  // Get all known Singapore bus stops
  public getAllBusStops(): BusStop[] {
    return SINGAPORE_BUS_STOPS;
  }

  // Find stop by code
  public getBusStopByCode(code: string): BusStop | undefined {
    return SINGAPORE_BUS_STOPS.find(s => s.BusStopCode === code);
  }

  // Search stops by code, road name, description, or service number
  public searchBusStops(query: string): BusStop[] {
    const q = query.trim().toLowerCase();
    if (!q) return SINGAPORE_BUS_STOPS;

    return SINGAPORE_BUS_STOPS.filter(stop => {
      const matchCode = stop.BusStopCode.toLowerCase().includes(q);
      const matchDesc = stop.Description.toLowerCase().includes(q);
      const matchRoad = stop.RoadName.toLowerCase().includes(q);
      const matchService = stop.Services.some(svc => svc.toLowerCase() === q || svc.toLowerCase().startsWith(q));
      return matchCode || matchDesc || matchRoad || matchService;
    });
  }

  // Get bus stops sorted by distance from coordinates
  public getNearbyBusStops(lat: number, lng: number, radiusMeters = 3000): BusStop[] {
    return SINGAPORE_BUS_STOPS
      .map(stop => {
        const dist = calculateDistanceMeters(lat, lng, stop.Latitude, stop.Longitude);
        return {
          ...stop,
          DistanceMeters: dist,
        };
      })
      .filter(stop => stop.DistanceMeters! <= radiusMeters)
      .sort((a, b) => a.DistanceMeters! - b.DistanceMeters!);
  }

  // Fetch real-time arrivals for a bus stop
  public async getBusArrivals(busStopCode: string): Promise<{
    busStopCode: string;
    services: ServiceArrival[];
    timestamp: number;
    source: 'live-lta' | 'simulated';
  }> {
    // If user configured real LTA API and requested live data
    if (this.apiConfig.useLiveData && this.apiConfig.accountKey) {
      try {
        const liveResult = await this.fetchLtaArrivalsDirect(busStopCode);
        if (liveResult && liveResult.length > 0) {
          return {
            busStopCode,
            services: liveResult,
            timestamp: Date.now(),
            source: 'live-lta',
          };
        }
      } catch (err) {
        console.warn('LTA direct fetch failed, falling back to real-time simulation:', err);
      }
    }

    // Default: High-fidelity accurate Singapore simulation aligned with LTA DataMall schema
    const simulated = this.generateSimulatedArrivals(busStopCode);
    return {
      busStopCode,
      services: simulated,
      timestamp: Date.now(),
      source: 'simulated',
    };
  }

  // Direct LTA DataMall fetcher (via proxy or direct header if CORS allowed)
  private async fetchLtaArrivalsDirect(busStopCode: string): Promise<ServiceArrival[] | null> {
    const endpoint = this.apiConfig.proxyUrl
      ? `${this.apiConfig.proxyUrl.replace(/\/$/, '')}/BusArrivalv2?BusStopCode=${busStopCode}`
      : `https://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStopCode}`;

    const res = await fetch(endpoint, {
      headers: {
        AccountKey: this.apiConfig.accountKey,
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`LTA API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.Services || !Array.isArray(data.Services)) {
      return null;
    }

    const now = Date.now();
    return data.Services.map((svc: any) => {
      const transformBus = (b: any): NextBusInfo | undefined => {
        if (!b || !b.EstimatedArrival) return undefined;
        const arrivalTime = new Date(b.EstimatedArrival).getTime();
        const diffSeconds = Math.max(0, Math.round((arrivalTime - now) / 1000));
        return {
          OriginCode: b.OriginCode || '',
          DestinationCode: b.DestinationCode || '',
          EstimatedArrival: b.EstimatedArrival,
          EstimatedArrivalSeconds: diffSeconds,
          Latitude: parseFloat(b.Latitude) || 0,
          Longitude: parseFloat(b.Longitude) || 0,
          VisitNumber: b.VisitNumber || '1',
          Load: (b.Load as BusLoad) || 'SEA',
          Feature: (b.Feature as BusFeature) || 'WAB',
          Type: (b.Type as BusType) || 'SD',
          Speed: b.Latitude ? 30 : 0,
        };
      };

      const next1 = transformBus(svc.NextBus);
      const next2 = transformBus(svc.NextBus2);
      const next3 = transformBus(svc.NextBus3);

      return {
        ServiceNo: svc.ServiceNo,
        Operator: (svc.Operator as any) || getServiceOperator(svc.ServiceNo),
        NextBus: next1 || this.createPlaceholderBus(svc.ServiceNo, 12),
        NextBus2: next2,
        NextBus3: next3,
        InService: !!next1,
      };
    });
  }

  // Generates high-fidelity real-time arrivals with deterministic clock ticking
  private generateSimulatedArrivals(busStopCode: string): ServiceArrival[] {
    const stop = this.getBusStopByCode(busStopCode);
    const services = stop ? stop.Services : ['190', '61', '65', '14', '960'];
    const now = Date.now();

    return services.map(serviceNo => {
      const operator = getServiceOperator(serviceNo);
      // Seed deterministic interval based on serviceNo & stop code
      const seed = (this.hashString(serviceNo + busStopCode) % 600);
      const cycleTime = 12 * 60; // 12-minute headway
      const currentCycleOffset = (Math.floor(now / 1000) + seed) % cycleTime;

      // 1st bus: 0 to 6 mins
      const bus1Seconds = Math.max(15, (cycleTime - currentCycleOffset) % (6 * 60));
      // 2nd bus: 7 to 14 mins
      const bus2Seconds = bus1Seconds + 7 * 60 + ((seed * 7) % 180);
      // 3rd bus: 15 to 24 mins
      const bus3Seconds = bus2Seconds + 9 * 60 + ((seed * 11) % 240);

      const loads: BusLoad[] = ['SEA', 'SEA', 'SDA', 'SEA', 'LSD', 'SDA'];
      const loadIndex1 = (seed + Math.floor(now / 60000)) % loads.length;
      const loadIndex2 = (seed + 1) % loads.length;
      const loadIndex3 = (seed + 2) % loads.length;

      const types: BusType[] = ['DD', 'SD', 'DD', 'SD', 'BD'];
      const typeIndex = seed % types.length;

      const stopLat = stop?.Latitude || 1.2968;
      const stopLng = stop?.Longitude || 103.8529;

      // Calculate approximate bus 1 GPS coordinates (advancing towards the stop)
      const distFactor = Math.min(1, bus1Seconds / 360); // 0 when arrived, 1 when 6 mins away
      const busLat = stopLat - 0.008 * distFactor * (seed % 2 === 0 ? 1 : -1);
      const busLng = stopLng - 0.008 * distFactor * (seed % 3 === 0 ? 1 : -1);

      const makeBus = (secs: number, load: BusLoad, type: BusType, lat: number, lng: number): NextBusInfo => {
        const arrivalDate = new Date(now + secs * 1000);
        return {
          OriginCode: '01012',
          DestinationCode: '84009',
          EstimatedArrival: arrivalDate.toISOString(),
          EstimatedArrivalSeconds: secs,
          Latitude: lat,
          Longitude: lng,
          VisitNumber: '1',
          Load: load,
          Feature: 'WAB',
          Type: type,
          Speed: Math.round(25 + (seed % 20)),
        };
      };

      return {
        ServiceNo: serviceNo,
        Operator: operator,
        NextBus: makeBus(bus1Seconds, loads[loadIndex1], types[typeIndex], busLat, busLng),
        NextBus2: makeBus(bus2Seconds, loads[loadIndex2], types[(typeIndex + 1) % types.length], stopLat - 0.02, stopLng - 0.02),
        NextBus3: makeBus(bus3Seconds, loads[loadIndex3], types[(typeIndex + 2) % types.length], stopLat - 0.04, stopLng - 0.04),
        InService: true,
      };
    }).sort((a, b) => a.NextBus.EstimatedArrivalSeconds - b.NextBus.EstimatedArrivalSeconds);
  }

  private createPlaceholderBus(serviceNo: string, mins: number): NextBusInfo {
    const arrivalDate = new Date(Date.now() + mins * 60000);
    return {
      OriginCode: '00000',
      DestinationCode: '00000',
      EstimatedArrival: arrivalDate.toISOString(),
      EstimatedArrivalSeconds: mins * 60,
      Latitude: 1.3521,
      Longitude: 103.8198,
      VisitNumber: '1',
      Load: 'SEA',
      Feature: 'WAB',
      Type: 'SD',
      Speed: 30,
    };
  }

  // Get full route details for a bus service
  public getRouteDetails(serviceNo: string): BusRouteDetails | null {
    if (DETAILED_ROUTES[serviceNo]) {
      return DETAILED_ROUTES[serviceNo];
    }

    // Dynamic fallback route for other services
    const matchingStops = SINGAPORE_BUS_STOPS.filter(s => s.Services.includes(serviceNo));
    if (matchingStops.length > 0) {
      const operator = getServiceOperator(serviceNo);
      return {
        ServiceNo: serviceNo,
        Operator: operator,
        Direction: 1,
        Origin: matchingStops[0].Description,
        Destination: matchingStops[matchingStops.length - 1].Description,
        Category: 'Trunk',
        OperatingHours: {
          weekday: '05:45 - 23:30',
          saturday: '05:45 - 23:30',
          sunday: '06:00 - 23:30',
        },
        FrequencyMins: {
          peak: '6 - 10 min',
          offPeak: '10 - 14 min',
        },
        Stops: matchingStops.map((s, idx) => ({
          StopSequence: idx + 1,
          BusStopCode: s.BusStopCode,
          RoadName: s.RoadName,
          Description: s.Description,
          DistanceKm: parseFloat((idx * 1.4).toFixed(1)),
          Latitude: s.Latitude,
          Longitude: s.Longitude,
        })),
        ActiveBuses: [
          {
            id: `${serviceNo}-live-1`,
            serviceNo,
            operator,
            latitude: matchingStops[0].Latitude + 0.003,
            longitude: matchingStops[0].Longitude + 0.002,
            currentStopCode: matchingStops[0].BusStopCode,
            nextStopCode: matchingStops[Math.min(1, matchingStops.length - 1)].BusStopCode,
            nextArrivalMins: 3,
            load: 'SEA',
            type: 'DD',
            feature: 'WAB',
            speed: 34,
            bearing: 85,
          },
        ],
      };
    }

    return null;
  }

  // Saved / Bookmarked Bus Stops Management
  public getSavedStops(): SavedStopItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED_STOPS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    // Default initial starred commute stops
    return [
      {
        id: '01012',
        busStopCode: '01012',
        roadName: 'Victoria St',
        description: 'Hotel Grand Pacific',
        pinnedServices: ['61', '190', '12'],
        tag: 'Frequent',
        savedAt: Date.now() - 86400000,
      },
      {
        id: '08138',
        busStopCode: '08138',
        roadName: 'Orchard Rd',
        description: 'Somerset Stn',
        pinnedServices: ['190', '65'],
        tag: 'Work',
        savedAt: Date.now() - 43200000,
      },
      {
        id: '01112',
        busStopCode: '01112',
        roadName: 'Victoria St',
        description: 'Bugis Stn Exit A',
        pinnedServices: ['960', '2'],
        tag: 'Home',
        savedAt: Date.now() - 21600000,
      },
    ];
  }

  public saveStop(stop: BusStop, tag: 'Home' | 'Work' | 'Frequent' | 'Other' = 'Frequent', pinnedServices?: string[]): void {
    const list = this.getSavedStops();
    const existingIndex = list.findIndex(s => s.busStopCode === stop.BusStopCode);
    
    const item: SavedStopItem = {
      id: stop.BusStopCode,
      busStopCode: stop.BusStopCode,
      roadName: stop.RoadName,
      description: stop.Description,
      pinnedServices: pinnedServices || stop.Services.slice(0, 3),
      tag,
      savedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }

    try {
      localStorage.setItem(STORAGE_KEY_SAVED_STOPS, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  public removeSavedStop(busStopCode: string): void {
    const list = this.getSavedStops().filter(s => s.busStopCode !== busStopCode);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_STOPS, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  public isStopSaved(busStopCode: string): boolean {
    return this.getSavedStops().some(s => s.busStopCode === busStopCode);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
