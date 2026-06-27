# ⛏ MCTools API

A public, free, multi-function Minecraft API hosted on Cloudflare Workers.

**Base URL:** `https://mctools.liamt.xyz`

---

## Endpoints

### Player

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/player/:name` | Full player profile |
| GET | `/player/:name/uuid` | Player UUID |
| GET | `/player/:name/skin` | Skin info |
| GET | `/player/:name/head` | Head render (proxy) |
| GET | `/player/:name/body` | Body render (proxy) |

**Example:**
```
GET https://mctools.liamt.xyz/player/Notch
```
```json
{
  "uuid": "069a79f444e94726a5befca90e38aaf5",
  "uuid_dashed": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  "name": "Notch",
  "skin": {
    "url": "https://textures.minecraft.net/texture/...",
    "model": "classic"
  },
  "cape": null,
  "head_render": "https://mctools.liamt.xyz/player/Notch/head",
  "body_render": "https://mctools.liamt.xyz/player/Notch/body"
}
```

---

### Server

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/server/:host` | Server status (Java, default port 25565) |
| GET | `/server/:host/:port` | Server status with custom port |

**Query params:**
- `?bedrock=true` — Ping a Bedrock server (default port 19132)

**Example:**
```
GET https://mctools.liamt.xyz/server/hypixel.net
```
```json
{
  "online": true,
  "host": "hypixel.net",
  "port": 25565,
  "edition": "java",
  "version": "Hypixel Network",
  "motd": { "raw": "...", "clean": "..." },
  "players": { "online": 40000, "max": 200000 },
  "favicon": "data:image/png;base64,...",
  "latency": 12
}
```

---

### Utils

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/utils/uuid/:uuid` | UUID → player name |
| GET | `/utils/color` | Minecraft color & format codes |
| POST | `/utils/encode` | Encode `&` color codes → `§` |

**Encode example:**
```
POST https://mctools.liamt.xyz/utils/encode
Content-Type: application/json

{ "text": "&aHello &lWorld&r!" }
```
```json
{ "input": "&aHello &lWorld&r!", "encoded": "§aHello §lWorld§r!" }
```

---

## Tech Stack

- **API:** [Hono](https://hono.dev/) on Cloudflare Workers
- **Frontend:** Vite + React + TypeScript
- **3D Viewer:** [skinview3d](https://github.com/bs-community/skinview3d)
- **Data sources:** Mojang API, Session Server, mcstatus.io

## Self-hosting

```bash
# Install dependencies
npm install

# Dev
wrangler dev

# Deploy
wrangler deploy
```

Frontend:
```bash
cd web
npm install
npm run dev
```

---

## License

See [LICENSE](./LICENSE).

© 2025 liamt. All rights reserved.
