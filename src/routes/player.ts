import { Hono } from 'hono'

export const playerRoutes = new Hono()

async function safeJson(res: Response) {
  const text = await res.text()
  if (!text || !text.trim()) return null
  try { return JSON.parse(text) } catch { return null }
}

const dashUuid = (u: string) => {
  const c = u.replace(/-/g, '')
  return `${c.slice(0,8)}-${c.slice(8,12)}-${c.slice(12,16)}-${c.slice(16,20)}-${c.slice(20)}`
}
const toHttps = (url: string) => url.replace('http://', 'https://')

async function proxyImage(url: string, filename = 'image.png'): Promise<Response> {
  const res = await fetch(url)
  if (!res.ok) return new Response('Not found', { status: 404 })
  const body = await res.arrayBuffer()
  return new Response(body, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

interface PlayerDBPlayer {
  username: string
  id: string
  raw_id: string
  skin_texture?: string
  cape_texture?: string
  properties: Array<{ name: string; value: string }>
}

async function getProfile(name: string, base: string) {
  const res = await fetch(`https://playerdb.co/api/player/minecraft/${name}`)
  if (!res.ok) return null

  const json = await safeJson(res) as { success: boolean; data?: { player: PlayerDBPlayer } } | null
  if (!json?.success || !json.data) return null

  const p = json.data.player
  const uuid = p.raw_id
  const realName = p.username

  // Decodificar textures para obtener modelo slim/classic y cape
  let slim = false
  let capeUrl: string | null = null
  const texProp = p.properties.find(x => x.name === 'textures')
  if (texProp) {
    try {
      const decoded = JSON.parse(atob(texProp.value)) as {
        textures: {
          SKIN?: { url: string; metadata?: { model: string } }
          CAPE?: { url: string }
        }
      }
      slim = decoded.textures.SKIN?.metadata?.model === 'slim'
      capeUrl = decoded.textures.CAPE?.url ?? null
    } catch { /* ignore */ }
  }

  return {
    uuid,
    uuid_dashed: dashUuid(uuid),
    name: realName,
    skin: p.skin_texture
      ? { url: `${base}/player/${realName}/skin-texture`, model: slim ? 'slim' : 'classic' }
      : null,
    cape: capeUrl
      ? { url: `${base}/player/${realName}/cape-texture` }
      : null,
    head_render: `${base}/player/${realName}/head`,
    body_render: `${base}/player/${realName}/body`,
    // URLs originales para uso interno del 3D viewer (CORS nativo de Mojang)
    _textures: {
      skin: p.skin_texture ? toHttps(p.skin_texture) : null,
      cape: capeUrl ? toHttps(capeUrl) : null,
    },
  }
}

playerRoutes.get('/:name', async (c) => {
  const base = new URL(c.req.url).origin
  const name = c.req.param('name')
  const profile = await getProfile(name, base)
  if (!profile) return c.json({ error: `Player "${name}" not found` }, 404)
  const { _textures, ...pub } = profile
  void _textures
  return c.json(pub)
})

playerRoutes.get('/:name/uuid', async (c) => {
  const name = c.req.param('name')
  const res = await fetch(`https://playerdb.co/api/player/minecraft/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const json = await safeJson(res) as { success: boolean; data?: { player: PlayerDBPlayer } } | null
  if (!json?.success || !json.data) return c.json({ error: 'Not found' }, 404)
  const p = json.data.player
  return c.json({ name: p.username, uuid: p.raw_id, uuid_dashed: dashUuid(p.raw_id) })
})

playerRoutes.get('/:name/skin', async (c) => {
  const base = new URL(c.req.url).origin
  const name = c.req.param('name')
  const profile = await getProfile(name, base)
  if (!profile) return c.json({ error: `Player "${name}" not found` }, 404)
  return c.json({ name: profile.name, uuid: profile.uuid, skin: profile.skin, head_render: profile.head_render, body_render: profile.body_render })
})

playerRoutes.get('/:name/skin-texture', async (c) => {
  const name = c.req.param('name')
  const base = new URL(c.req.url).origin
  const profile = await getProfile(name, base)
  if (!profile?._textures?.skin) return c.json({ error: 'No skin found' }, 404)
  return proxyImage(profile._textures.skin, `${name}-skin.png`)
})

playerRoutes.get('/:name/cape-texture', async (c) => {
  const name = c.req.param('name')
  const base = new URL(c.req.url).origin
  const profile = await getProfile(name, base)
  if (!profile?._textures?.cape) return c.json({ error: 'No cape found' }, 404)
  return proxyImage(profile._textures.cape, `${name}-cape.png`)
})

playerRoutes.get('/:name/head', async (c) => {
  const name = c.req.param('name')
  const size = Number(c.req.query('size') ?? 200)
  const res = await fetch(`https://playerdb.co/api/player/minecraft/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const json = await safeJson(res) as { success: boolean; data?: { player: PlayerDBPlayer } } | null
  if (!json?.success || !json.data) return c.json({ error: 'Not found' }, 404)
  return proxyImage(`https://mc-heads.net/head/${json.data.player.raw_id}/${size}`, `${name}-head.png`)
})

playerRoutes.get('/:name/body', async (c) => {
  const name = c.req.param('name')
  const res = await fetch(`https://playerdb.co/api/player/minecraft/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const json = await safeJson(res) as { success: boolean; data?: { player: PlayerDBPlayer } } | null
  if (!json?.success || !json.data) return c.json({ error: 'Not found' }, 404)
  return proxyImage(`https://visage.surgeplay.com/full/400/${json.data.player.raw_id}`, `${name}-body.png`)
})
