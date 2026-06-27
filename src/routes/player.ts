import { Hono } from 'hono'
import UPNG from 'upng-js'

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

async function proxyImage(url: string): Promise<Response> {
  const res = await fetch(url)
  if (!res.ok) return new Response('Not found', { status: 404 })
  const body = await res.arrayBuffer()
  return new Response(body, {
    headers: {
      'Content-Type': 'image/png',
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
      ? { url: `${base}/player/${realName}/skin.png`, model: slim ? 'slim' : 'classic' }
      : null,
    cape: capeUrl
      ? { url: `${base}/player/${realName}/cape.png` }
      : null,
    head_render: `${base}/player/${realName}/head.png`,
    body_render: `${base}/player/${realName}/body.png`,
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

playerRoutes.get('/:name/skin.png', async (c) => {
  const name = c.req.param('name')
  const base = new URL(c.req.url).origin
  const profile = await getProfile(name, base)
  if (!profile?._textures?.skin) return c.json({ error: 'No skin found' }, 404)
  return proxyImage(profile._textures.skin)
})

playerRoutes.get('/:name/cape.png', async (c) => {
  const name = c.req.param('name')
  const base = new URL(c.req.url).origin
  const profile = await getProfile(name, base)
  if (!profile?._textures?.cape) return c.json({ error: 'No cape found' }, 404)

  const res = await fetch(profile._textures.cape)
  if (!res.ok) return c.json({ error: 'Failed to fetch cape' }, 502)
  const buf = await res.arrayBuffer()

  // Decodificar PNG, recortar cara frontal de la capa (x=1,y=1,w=10,h=16 en 64x32)
  const img = UPNG.decode(buf)
  const frames = UPNG.toRGBA8(img)
  const src = new Uint8Array(frames[0])
  const iw = img.width   // ancho original (64 o 128...)
  const scale = iw / 64
  const sx = Math.round(1 * scale), sy = Math.round(1 * scale)
  const sw = Math.round(10 * scale), sh = Math.round(16 * scale)

  // Extraer y escalar con nearest-neighbor (pixelado estilo Minecraft)
  const zoom = 20
  const ow = sw * zoom, oh = sh * zoom
  const out = new Uint8Array(ow * oh * 4)
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const si = ((sy + Math.floor(y / zoom)) * iw + (sx + Math.floor(x / zoom))) * 4
      const di = (y * ow + x) * 4
      out[di]     = src[si]
      out[di + 1] = src[si + 1]
      out[di + 2] = src[si + 2]
      out[di + 3] = src[si + 3]
    }
  }

  const encoded = UPNG.encode([out.buffer], ow, oh, 0)
  return new Response(encoded, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

playerRoutes.get('/:name/head.png', async (c) => {
  const name = c.req.param('name')
  const size = Number(c.req.query('size') ?? 200)
  const res = await fetch(`https://playerdb.co/api/player/minecraft/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const json = await safeJson(res) as { success: boolean; data?: { player: PlayerDBPlayer } } | null
  if (!json?.success || !json.data) return c.json({ error: 'Not found' }, 404)
  return proxyImage(`https://mc-heads.net/head/${json.data.player.raw_id}/${size}`)
})

playerRoutes.get('/:name/body.png', async (c) => {
  const name = c.req.param('name')
  const res = await fetch(`https://playerdb.co/api/player/minecraft/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const json = await safeJson(res) as { success: boolean; data?: { player: PlayerDBPlayer } } | null
  if (!json?.success || !json.data) return c.json({ error: 'Not found' }, 404)
  return proxyImage(`https://visage.surgeplay.com/full/400/${json.data.player.raw_id}`)
})
