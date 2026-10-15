import type { IncomingMessage, ServerResponse } from 'http';

const LTA_BUS_ARRIVAL_V3_BASE = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

interface QueryParams {
  BusStopCode?: string;
  ServiceNo?: string;
  AccountKey?: string;
}

/**
 * Extracts query parameters from a Node.js incoming request or URL string
 */
function parseQueryParams(req: IncomingMessage & { query?: Record<string, string | string[]> }): QueryParams {
  if (req.query) {
    return {
      BusStopCode: typeof req.query.BusStopCode === 'string' ? req.query.BusStopCode : undefined,
      ServiceNo: typeof req.query.ServiceNo === 'string' ? req.query.ServiceNo : undefined,
      AccountKey: typeof req.query.AccountKey === 'string' ? req.query.AccountKey : undefined,
    };
  }

  try {
    const url = new URL(req.url || '', 'http://localhost');
    return {
      BusStopCode: url.searchParams.get('BusStopCode') || undefined,
      ServiceNo: url.searchParams.get('ServiceNo') || undefined,
      AccountKey: url.searchParams.get('AccountKey') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Retrieves the LTA AccountKey from environment variables, headers, or query
 */
function resolveAccountKey(
  req: IncomingMessage,
  queryParams: QueryParams
): string | null {
  const envKey = process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY;
  if (envKey && envKey !== 'YOUR_LTA_ACCOUNT_KEY' && envKey.trim().length > 0) {
    return envKey.trim();
  }

  // Header fallback
  const headerKey = req.headers['accountkey'] || req.headers['x-account-key'];
  if (typeof headerKey === 'string' && headerKey.trim().length > 0) {
    return headerKey.trim();
  }

  // Query parameter fallback (useful for testing)
  if (queryParams.AccountKey && queryParams.AccountKey.trim().length > 0) {
    return queryParams.AccountKey.trim();
  }

  return null;
}

/**
 * Serverless Handler for LTA DataMall Bus Arrival v3
 * GET /api/busarrival?BusStopCode=83139[&ServiceNo=15]
 */
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse
): Promise<void> {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed', message: 'Use GET request method.' }));
    return;
  }

  const query = parseQueryParams(req);
  const busStopCode = query.BusStopCode;

  if (!busStopCode) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        error: 'Missing BusStopCode parameter',
        message: 'BusStopCode query parameter is required (e.g. /api/busarrival?BusStopCode=83139).',
        example: '/api/busarrival?BusStopCode=83139',
      })
    );
    return;
  }

  const accountKey = resolveAccountKey(req, query);

  if (!accountKey) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error: 'LTA AccountKey not configured',
        message:
          'Please set the LTA_ACCOUNT_KEY environment variable, or pass it via the AccountKey HTTP request header.',
        hint: 'Request a free key at https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
        configured: false,
      })
    );
    return;
  }

  // Build target LTA v3 URL
  const targetUrl = new URL(LTA_BUS_ARRIVAL_V3_BASE);
  targetUrl.searchParams.set('BusStopCode', busStopCode);
  if (query.ServiceNo) {
    targetUrl.searchParams.set('ServiceNo', query.ServiceNo);
  }

  try {
    const ltaResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!ltaResponse.ok) {
      const errText = await ltaResponse.text();
      res.statusCode = ltaResponse.status;
      res.end(
        JSON.stringify({
          error: `LTA DataMall API error: HTTP ${ltaResponse.status}`,
          status: ltaResponse.status,
          details: errText,
        })
      );
      return;
    }

    const data = await ltaResponse.json();

    // Cache arrival results briefly (10 seconds) to prevent throttling while staying real-time
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=20');
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (err: any) {
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        error: 'Failed to communicate with LTA DataMall',
        details: err?.message || 'Network failure',
      })
    );
  }
}

/**
 * Web Standard GET handler (for Edge runtimes, Next.js, Cloudflare Workers, etc.)
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const busStopCode = url.searchParams.get('BusStopCode');
  const serviceNo = url.searchParams.get('ServiceNo');

  if (!busStopCode) {
    return new Response(
      JSON.stringify({
        error: 'Missing BusStopCode parameter',
        message: 'BusStopCode query parameter is required (e.g. ?BusStopCode=83139).',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  const envKey = process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY;
  const headerKey = request.headers.get('AccountKey') || request.headers.get('x-account-key');
  const queryKey = url.searchParams.get('AccountKey');
  const accountKey = (envKey && envKey !== 'YOUR_LTA_ACCOUNT_KEY' ? envKey : null) || headerKey || queryKey;

  if (!accountKey) {
    return new Response(
      JSON.stringify({
        error: 'LTA AccountKey not configured',
        message:
          'Please set the LTA_ACCOUNT_KEY environment variable, or pass it via the AccountKey HTTP request header.',
        configured: false,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  const targetUrl = new URL(LTA_BUS_ARRIVAL_V3_BASE);
  targetUrl.searchParams.set('BusStopCode', busStopCode);
  if (serviceNo) {
    targetUrl.searchParams.set('ServiceNo', serviceNo);
  }

  try {
    const ltaResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    const data = await ltaResponse.json();

    return new Response(JSON.stringify(data), {
      status: ltaResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to communicate with LTA DataMall',
        details: err?.message || 'Network failure',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
