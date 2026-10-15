export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy
export type BusFeature = 'WAB' | ''; // Wheelchair Accessible Bus
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export interface NextBusInfo {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO 8601 string
  EstimatedArrivalSeconds: number; // dynamically computed
  Latitude: number;
  Longitude: number;
  VisitNumber: string;
  Load: BusLoad;
  Feature: BusFeature;
  Type: BusType;
  Speed?: number; // km/h
}

export interface ServiceArrival {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: NextBusInfo;
  NextBus2?: NextBusInfo;
  NextBus3?: NextBusInfo;
  InService: boolean;
}

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  Services: string[];
  Zone?: 'Central' | 'East' | 'West' | 'North' | 'North-East';
  DistanceMeters?: number;
}

export interface BusRouteStop {
  StopSequence: number;
  BusStopCode: string;
  RoadName: string;
  Description: string;
  DistanceKm: number;
  Latitude: number;
  Longitude: number;
}

export interface ActiveBusPosition {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  latitude: number;
  longitude: number;
  currentStopCode: string;
  nextStopCode: string;
  nextArrivalMins: number;
  load: BusLoad;
  type: BusType;
  feature: BusFeature;
  speed: number;
  bearing: number;
}

export interface BusRouteDetails {
  ServiceNo: string;
  Operator: BusOperator;
  Direction: number;
  Origin: string;
  Destination: string;
  Category: 'Trunk' | 'Feeder' | 'Express' | 'City Direct';
  OperatingHours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  FrequencyMins: {
    peak: string;
    offPeak: string;
  };
  Stops: BusRouteStop[];
  ActiveBuses: ActiveBusPosition[];
}

export interface SavedStopItem {
  id: string;
  busStopCode: string;
  roadName: string;
  description: string;
  pinnedServices?: string[];
  tag?: 'Home' | 'Work' | 'Frequent' | 'Other';
  savedAt: number;
}

export interface LtaApiConfig {
  accountKey: string;
  useLiveData: boolean;
  proxyUrl?: string;
  autoRefreshIntervalSeconds: number;
}
