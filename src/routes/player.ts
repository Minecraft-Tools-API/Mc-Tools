import { Hono } from 'hono'

export const playerRoutes = new Hono()

async function safeJson(res: Response) {
  const text = await res.text()
  if (!text || !text.trim()) return null
  try { return JSON.parse(text) } catch { return null }
}

const dashUuid = (u: string) => `${u.slice(0,8)}-${u.slice(8,12)}-${u.slice(12,16)}-${u.slice(16,20)}-${u.slice(20)}`
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

async function getProfile(name: string, base: string) {
  const uuidRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
  if (!uuidRes.ok) return null

  const uuidData = await safeJson(uuidRes)
  if (!uuidData) return null

  const { id: uuid, name: realName } = uuidData as { id: string; name: string }

  const profileRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}?unsigned=false`)
  const noSkin = () => ({
    uuid, uuid_dashed: dashUuid(uuid), name: realName, skin: null, cape: null,
    head_render: `${base}/player/${realName}/head`,
    body_render: `${base}/player/${realName}/body`,
  })

  if (!profileRes.ok || profileRes.status === 204) return noSkin()

  const profile = await safeJson(profileRes) as { properties: Array<{ name: string; value: string }> } | null
  if (!profile) return noSkin()

  const textureProp = profile.properties.find(p => p.name === 'textures')
  if (!textureProp) return noSkin()

  let decoded: { textures: { SKIN?: { url: string; metadata?: { model: string } }; CAPE?: { url: string } } } | null = null
  try { decoded = JSON.parse(atob(textureProp.value)) } catch { /* no texture data */ }

  const skin = decoded?.textures?.SKIN
  const cape = decoded?.textures?.CAPE

  return {
    uuid,
    uuid_dashed: dashUuid(uuid),
    name: realName,
    // textures.minecraft.net ya tiene CORS abierto, se mantiene la URL original
    skin: skin ? { url: toHttps(skin.url), model: skin.metadata?.model ?? 'classic' } : null,
    cape: cape ? { url: toHttps(cape.url) } : null,
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
  const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const data = await safeJson(res) as { id: string; name: string } | null
  if (!data) return c.json({ error: 'Failed to parse response' }, 500)
  return c.json({ name: data.name, uuid: data.id, uuid_dashed: dashUuid(data.id) })
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
  const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const data = await safeJson(res) as { id: string } | null
  if (!data) return c.json({ error: 'Not found' }, 500)
  return proxyImage(`https://mc-heads.net/head/${data.id}/${size}`)
})

// Proxy: cuerpo completo
playerRoutes.get('/:name/body', async (c) => {
  const name = c.req.param('name')
  const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
  if (!res.ok) return c.json({ error: `Player "${name}" not found` }, 404)
  const data = await safeJson(res) as { id: string } | null
  if (!data) return c.json({ error: 'Not found' }, 500)
  return proxyImage(`https://visage.surgeplay.com/full/400/${data.id}`)
})
