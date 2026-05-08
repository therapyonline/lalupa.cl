/**
 * Health check endpoint para uptime monitoring (Vercel cron, Pingdom, etc.).
 *
 * Devuelve 200 con un payload mínimo si la app puede servir requests.
 * Cero dependencias externas, esto debe responder incluso si todo lo
 * demás está roto.
 *
 *   GET /api/health → { status: 'ok', timestamp: ISO, uptime: seconds }
 */

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const STARTED_AT = Date.now()

export function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
      version: '0.1.0',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate',
      },
    },
  )
}
