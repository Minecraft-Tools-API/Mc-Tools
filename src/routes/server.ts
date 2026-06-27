import { Hono } from 'hono'

export const serverRoutes = new Hono()

interface ServerStatus {
  online: boolean
  host: string
  port: number
  edition: 'java' | 'bedrock'
  version?: string
  protocol?: number
  motd?: { raw: string; clean: string }
  players?: { online: number; max: number; sample?: Array<{ name: string; id: string }> }
  favicon?: string
  latency?: number
  ip?: string
}

async function pingServer(host: string, port: number, bedrock = false): Promise<ServerStatus> {
  const type = bedrock ? 'bedrock' : 'java'
  const res = await fetch(`https://api.mcstatus.io/v2/status/${type}/${host}:${port}`)

  if (!res.ok) return { online: false, host, port, edition: type }

  const data = await res.json() as {
    online: boolean
    host: string
    port: number
    version?: { name_clean?: string; name_raw?: string; protocol?: number }
    players?: { online: number; max: number; list?: Array<{ name_clean: string; uuid: string }> }
    motd?: { raw?: string; clean?: string }
    icon?: string
    latency?: number
    ip_address?: string
  }

  if (!data.online) return { online: false, host, port, edition: type }

  return {
    online: true,
    host: data.host ?? host,
    port: data.port ?? port,
    edition: type,
    version: data.version?.name_clean,
    protocol: data.version?.protocol,
    motd: data.motd ? { raw: data.motd.raw ?? '', clean: data.motd.clean ?? '' } : undefined,
    players: data.players ? {
      online: data.players.online,
      max: data.players.max,
      sample: data.players.list?.map(p => ({ name: p.name_clean, id: p.uuid })),
    } : undefined,
    favicon: data.icon,
    latency: data.latency,
    ip: data.ip_address,
  }
}

serverRoutes.get('/:host', async (c) => {
  const host = c.req.param('host')
  const bedrock = c.req.query('bedrock') === 'true'
  const status = await pingServer(host, bedrock ? 19132 : 25565, bedrock)
  return c.json(status, status.online ? 200 : 503)
})

serverRoutes.get('/:host/:port', async (c) => {
  const host = c.req.param('host')
  const port = Number(c.req.param('port'))
  const bedrock = c.req.query('bedrock') === 'true'

  if (isNaN(port) || port < 1 || port > 65535) {
    return c.json({ error: 'Invalid port number' }, 400)
  }

  const status = await pingServer(host, port, bedrock)
  return c.json(status, status.online ? 200 : 503)
})
