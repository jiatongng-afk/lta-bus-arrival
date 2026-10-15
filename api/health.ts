import type { IncomingMessage, ServerResponse } from 'http';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: {
    ltaKeyConfigured: boolean;
    nodeEnv: string;
  };
  endpoints: {
    busArrival: string;
    health: string;
  };
}

/**
 * Serverless Health check handler
 * Checks service availability and environment status
 */
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse
): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const ltaKey = process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY || '';

  const healthData: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: {
      ltaKeyConfigured: Boolean(ltaKey && ltaKey !== 'YOUR_LTA_ACCOUNT_KEY'),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    endpoints: {
      busArrival: '/api/busarrival?BusStopCode=83139',
      health: '/api/health',
    },
  };

  res.statusCode = 200;
  res.end(JSON.stringify(healthData, null, 2));
}

/**
 * Web Standard Request/Response export (for Edge / Next.js / Cloudflare / modern runtimes)
 */
export async function GET(_request?: Request): Promise<Response> {
  const ltaKey = process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY || '';

  const healthData: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: {
      ltaKeyConfigured: Boolean(ltaKey && ltaKey !== 'YOUR_LTA_ACCOUNT_KEY'),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    endpoints: {
      busArrival: '/api/busarrival?BusStopCode=83139',
      health: '/api/health',
    },
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
