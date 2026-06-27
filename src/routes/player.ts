import { Hono } from 'hono'

export const playerRoutes = new Hono()

async function safeJson(res: Response) {
  const text = await res.text()
  if (!text || !text.trim()) return null
  try { return JSON.parse(text) } catch { return null }
}

const dashUuid = (u: string) => {
  const clean = u.replace(/-/g, '')
  return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`
}
const toHttps = (url: string) => url.replace('http://', 'https://')

async function proxyImage(url: string): Promise<Response> {
  const res = await fetch(url)
  if (!res.ok) return new Response('Not found', { status: 404 })
  const body = await res.arrayBuffer()
  return new Response(body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/png',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

interface AshconProfile {
  uuid: string
  username: string
  textures: {
    skin?: { url: string }
    cape?: { url: string }
    slim: boolean
    custom: boolean
  }
}

async function getProfile(name: string, base: string) {
  // ashcon.app: proxy de Mojang que funciona desde Cloudflare Workers
  const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`)
  if (!res.ok) return null

  const data = await safeJson(res) as AshconProfile | null
  if (!data?.uuid) return null

  const uuid = data.uuid.replace(/-/g, '')
  const realName = data.username

  return {
    uuid,
    uuid_dashed: dashUuid(uuid),
    name: realName,
    skin: data.textures.skin
      ? { url: toHttps(data.textures.skin.url), model: data.textures.slim ? 'slim' : 'classic' }
      : null,
    cape: data.textures.cape
      ? { url: toHttps(data.textures.cape.url) }
      : null,
    head_render: `${base}/player/${realName}/head`,
    body_render: `${base}/player/${realName}/body`,
  }
}

playerRoutes.get('/:name', async (c) => {
  const base = new URL(c.req.url).origin
  const name = c.req.param('name')
  const profile = await getProfile(name, base)
  if (!profile) return c.json({ error: `Player "${name}" not found` }, 404)
  return c.json(profile)
})

playerRoutes.get('/:name/uuid', async (c) => {
  const name = c.req.param('name')
  const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const data = await safeJson(res) as AshconProfile | null
  if (!data?.uuid) return c.json({ error: 'Failed to parse response' }, 500)
  const uuid = data.uuid.replace(/-/g, '')
  return c.json({ name: data.username, uuid, uuid_dashed: dashUuid(uuid) })
})

playerRoutes.get('/:name/skin', async (c) => {
  const base = new URL(c.req.url).origin
  const name = c.req.param('name')
  const profile = await getProfile(name, base)
  if (!profile) return c.json({ error: `Player "${name}" not found` }, 404)
  return c.json({ name: profile.name, uuid: profile.uuid, skin: profile.skin, head_render: profile.head_render, body_render: profile.body_render })
})

// Proxy: cabeza pixelada
playerRoutes.get('/:name/head', async (c) => {
  const name = c.req.param('name')
  const size = Number(c.req.query('size') ?? 200)
  const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const data = await safeJson(res) as AshconProfile | null
  if (!data?.uuid) return c.json({ error: 'Not found' }, 500)
  const uuid = data.uuid.replace(/-/g, '')
  return proxyImage(`https://mc-heads.net/head/${uuid}/${size}`)
})

// Proxy: cuerpo completo
playerRoutes.get('/:name/body', async (c) => {
  const name = c.req.param('name')
  const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const data = await safeJson(res) as AshconProfile | null
  if (!data?.uuid) return c.json({ error: 'Not found' }, 500)
  const uuid = data.uuid.replace(/-/g, '')
  return proxyImage(`https://visage.surgeplay.com/full/400/${uuid}`)
})
