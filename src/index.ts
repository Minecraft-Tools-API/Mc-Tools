import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { playerRoutes } from './routes/player'
import { serverRoutes } from './routes/server'
import { utilRoutes } from './routes/utils'

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => {
  return c.json({
    name: 'MCTools API',
    version: '1.0.0',
    url: 'https://mctools.liamt.xyz',
    endpoints: {
      player: {
        '/player/:name': 'Full player profile (UUID, skin, cape)',
        '/player/:name/uuid': 'Get UUID from username',
        '/player/:name/skin': 'Skin texture URL and metadata',
        '/player/:name/head': 'Player head render URL',
      },
      server: {
        '/server/:host': 'Server status (online, players, version, motd)',
        '/server/:host/:port': 'Server status with custom port',
      },
      utils: {
        '/utils/uuid/:uuid': 'Get username from UUID',
        '/utils/color': 'List of all Minecraft color codes',
        '/utils/encode': 'Encode text with Minecraft formatting (POST)',
      },
    },
  })
})

app.route('/player', playerRoutes)
app.route('/server', serverRoutes)
app.route('/utils', utilRoutes)

app.notFound((c) => {
  return c.json({ error: 'Endpoint not found', docs: 'https://mctools.liamt.xyz/' }, 404)
})

app.onError((err, c) => {
  return c.json({ error: 'Internal server error', message: err.message }, 500)
})

export default app
