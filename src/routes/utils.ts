import { Hono } from 'hono'

export const utilRoutes = new Hono()

const COLOR_CODES: Record<string, { name: string; hex: string; chat_code: string }> = {
  '0': { name: 'Black',         hex: '#000000', chat_code: '§0' },
  '1': { name: 'Dark Blue',     hex: '#0000AA', chat_code: '§1' },
  '2': { name: 'Dark Green',    hex: '#00AA00', chat_code: '§2' },
  '3': { name: 'Dark Aqua',     hex: '#00AAAA', chat_code: '§3' },
  '4': { name: 'Dark Red',      hex: '#AA0000', chat_code: '§4' },
  '5': { name: 'Dark Purple',   hex: '#AA00AA', chat_code: '§5' },
  '6': { name: 'Gold',          hex: '#FFAA00', chat_code: '§6' },
  '7': { name: 'Gray',          hex: '#AAAAAA', chat_code: '§7' },
  '8': { name: 'Dark Gray',     hex: '#555555', chat_code: '§8' },
  '9': { name: 'Blue',          hex: '#5555FF', chat_code: '§9' },
  'a': { name: 'Green',         hex: '#55FF55', chat_code: '§a' },
  'b': { name: 'Aqua',          hex: '#55FFFF', chat_code: '§b' },
  'c': { name: 'Red',           hex: '#FF5555', chat_code: '§c' },
  'd': { name: 'Light Purple',  hex: '#FF55FF', chat_code: '§d' },
  'e': { name: 'Yellow',        hex: '#FFFF55', chat_code: '§e' },
  'f': { name: 'White',         hex: '#FFFFFF', chat_code: '§f' },
}

const FORMAT_CODES: Record<string, { name: string; chat_code: string }> = {
  'k': { name: 'Obfuscated',    chat_code: '§k' },
  'l': { name: 'Bold',          chat_code: '§l' },
  'm': { name: 'Strikethrough', chat_code: '§m' },
  'n': { name: 'Underline',     chat_code: '§n' },
  'o': { name: 'Italic',        chat_code: '§o' },
  'r': { name: 'Reset',         chat_code: '§r' },
}

utilRoutes.get('/uuid/:uuid', async (c) => {
  const uuid = c.req.param('uuid').replace(/-/g, '')

  if (!/^[0-9a-f]{32}$/i.test(uuid)) {
    return c.json({ error: 'Invalid UUID format' }, 400)
  }

  const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)

  if (!res.ok) {
    return c.json({ error: `No player found for UUID "${uuid}"` }, 404)
  }

  const data = await res.json() as { id: string; name: string }
  const id = data.id

  return c.json({
    name: data.name,
    uuid: id,
    uuid_dashed: `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`,
  })
})

utilRoutes.get('/color', (c) => {
  return c.json({
    colors: COLOR_CODES,
    formats: FORMAT_CODES,
    usage: 'Use § followed by a code in-game. Example: §aHello §lWorld',
  })
})

utilRoutes.post('/encode', async (c) => {
  let body: { text?: string } = {}
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.text || typeof body.text !== 'string') {
    return c.json({ error: 'Missing "text" field in body' }, 400)
  }

  const encoded = body.text.replace(/&([0-9a-fklmnor])/gi, '§$1')

  return c.json({
    input: body.text,
    encoded,
    note: 'Use & as a shorthand for the § symbol in your text',
  })
})
