import { useState, useEffect } from 'react'
import PlayerLookup from './components/PlayerLookup'
import ServerStatus from './components/ServerStatus'
import ColorCodes from './components/ColorCodes'
import fondImg from './assets/fond.png'

const tabs = [
  { id: 'player', label: 'Player' },
  { id: 'server', label: 'Server' },
  { id: 'utils',  label: 'Utils'  },
]

const endpoints = [
  {
    method: 'GET', cls: 'green', path: '/player/:name', desc: 'Perfil completo',
    params: [{ name: 'name', type: 'string', desc: 'Nombre de usuario de Minecraft' }],
    returns: 'uuid, uuid_dashed, name, skin { url, model }, cape { url }, head_render, body_render',
    example: '/player/Notch',
  },
  {
    method: 'GET', cls: 'green', path: '/player/:name/uuid', desc: 'Solo UUID',
    params: [{ name: 'name', type: 'string', desc: 'Nombre de usuario de Minecraft' }],
    returns: 'name, uuid, uuid_dashed',
    example: '/player/Notch/uuid',
  },
  {
    method: 'GET', cls: 'green', path: '/player/:name/skin', desc: 'Skin info',
    params: [{ name: 'name', type: 'string', desc: 'Nombre de usuario de Minecraft' }],
    returns: 'name, uuid, skin { url, model }, head_render, body_render',
    example: '/player/Notch/skin',
  },
  {
    method: 'GET', cls: 'green', path: '/player/:name/head', desc: 'Head image redirect',
    params: [{ name: 'name', type: 'string', desc: 'Nombre de usuario de Minecraft' }],
    query: [{ name: 'size', type: 'number', desc: 'Tamaño en px (default: 128)' }],
    returns: 'Redirect 302 a imagen PNG de la cabeza',
    example: '/player/Notch/head?size=256',
  },
  {
    method: 'GET', cls: 'aqua', path: '/server/:host', desc: 'Estado del servidor',
    params: [{ name: 'host', type: 'string', desc: 'IP o dominio del servidor' }],
    query: [{ name: 'bedrock', type: 'boolean', desc: 'true para servidores Bedrock (default: false)' }],
    returns: 'online, host, port, edition, version, motd, players, favicon, latency, ip',
    example: '/server/hypixel.net',
    note: 'Puerto por defecto: 25565 (Java) o 19132 (Bedrock). Devuelve 503 si offline.',
  },
  {
    method: 'GET', cls: 'aqua', path: '/server/:host/:port', desc: 'Puerto personalizado',
    params: [
      { name: 'host', type: 'string', desc: 'IP o dominio del servidor' },
      { name: 'port', type: 'number', desc: 'Puerto (1–65535)' },
    ],
    query: [{ name: 'bedrock', type: 'boolean', desc: 'true para servidores Bedrock' }],
    returns: 'Igual que /server/:host',
    example: '/server/hypixel.net/25565',
  },
  {
    method: 'GET', cls: 'gold', path: '/utils/uuid/:uuid', desc: 'UUID → nombre',
    params: [{ name: 'uuid', type: 'string', desc: 'UUID con o sin guiones' }],
    returns: 'name, uuid, uuid_dashed',
    example: '/utils/uuid/069a79f4-44e9-4726-a5be-fca90e38aaf5',
  },
  {
    method: 'GET', cls: 'gold', path: '/utils/color', desc: 'Códigos de color',
    params: [],
    returns: 'colors { code: { name, hex, chat_code } }, formats { code: { name, chat_code } }',
    example: '/utils/color',
  },
  {
    method: 'POST', cls: 'purple', path: '/utils/encode', desc: 'Encode §colores',
    body: '{ "text": "string" }',
    returns: 'input, encoded (& reemplazado por §)',
    example: 'POST /utils/encode  body: { "text": "&aHola &lMundo" }',
  },
]

export default function App() {
  const [tab, setTab] = useState('player')
  const [scrolled, setScrolled] = useState(false)
  const [openDoc, setOpenDoc] = useState<number | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Nav ── */}
      <nav className="anim-slide-down" style={{
        borderBottom: scrolled ? '1px solid rgba(255,170,0,0.15)' : '1px solid transparent',
        background: scrolled ? 'rgba(8,8,8,0.95)' : 'rgba(8,8,8,0.15)',
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(4px)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        boxShadow: scrolled ? '0 1px 32px rgba(0,0,0,0.7)' : 'none',
        transition: 'background .3s, border-color .3s, box-shadow .3s, backdrop-filter .3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', height: scrolled ? 80 : 110, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'height .3s' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/favicon (2).png" alt="MCTools" style={{ width: scrolled ? 48 : 60, height: scrolled ? 48 : 60, imageRendering: 'pixelated', transition: 'all .3s', flexShrink: 0 }} />
            <div>
              <span className="font-ten" style={{ fontSize: scrolled ? 22 : 30, color: '#fff', letterSpacing: 2, transition: 'font-size .3s', display: 'block' }}>MC<span style={{ color: 'var(--gold)' }}>Tools</span></span>
              <p style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'Minecraft, monospace', marginTop: 3, opacity: scrolled ? 0 : 1, transition: 'opacity .3s' }}>API</p>
            </div>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {['Player', 'Server', 'Utils'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{
                fontFamily: 'Minecraft, monospace',
                fontSize: scrolled ? 13 : 16,
                color: '#fff', textDecoration: 'none',
                padding: scrolled ? '8px 18px' : '10px 22px',
                borderRadius: 2,
                transition: 'font-size .3s, padding .3s, color .15s, background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >{l}</a>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 2, padding: scrolled ? '6px 14px' : '8px 18px', transition: 'padding .3s' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-l)', boxShadow: '0 0 8px var(--green-l)', display: 'inline-block', flexShrink: 0 }} className="pulse" />
              <span style={{ fontFamily: 'Minecraft, monospace', fontSize: scrolled ? 13 : 15, color: '#ccc', transition: 'font-size .3s' }}>mctools.liamt.xyz</span>
            </div>
            <span className="badge green" style={{ fontSize: scrolled ? 11 : 14, padding: scrolled ? '4px 10px' : '6px 14px', transition: 'all .3s' }}>v1.0.0</span>
          </div>

        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative',
        borderBottom: '1px solid #1f1f1f',
        padding: '200px 32px 110px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Fondo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${fondImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
          zIndex: 0,
        }} />
        {/* Gradiente encima para que el texto sea legible */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(15,15,15,0.75) 100%)',
          zIndex: 1,
        }} />
        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span className="badge gold anim-fade-up anim-d1" style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
            API Pública · Gratuita · Cloudflare Workers
          </span>

          <h1 className="anim-fade-up anim-d2" style={{ fontSize: 'clamp(32px, 6vw, 56px)', color: '#fff', marginBottom: 16 }}>
            <span style={{ color: 'var(--gold)' }}>MC</span>Tools API
          </h1>

          <p className="font-sans anim-fade-up anim-d3" style={{ color: 'var(--gray)', fontSize: 16, lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
            Una API multi-función para Minecraft. Consulta jugadores,
            servidores y utilidades desde un solo lugar.
          </p>

          <div className="anim-fade-up anim-d4" style={{ display: 'inline-flex', alignItems: 'center', background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: '10px 18px', gap: 6 }}>
            <span className="font-mono" style={{ color: 'var(--gray)' }}>GET</span>
            <span className="font-mono" style={{ color: 'var(--green-l)' }}>https://mctools.liamt.xyz</span>
            <span className="font-mono" style={{ color: 'var(--gray)' }}>/player/Notch</span>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 80px' }}>

        {/* ── Live Preview ── */}
        <section className="anim-fade-up anim-d1" style={{ marginBottom: 56 }}>
          <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(90deg, rgba(94,173,63,0.07) 0%, transparent 100%)', borderLeft: '3px solid var(--green)', borderRadius: '0 4px 4px 0' }}>
            <h2 className="section-title" style={{ marginBottom: 8, color: 'var(--green-l)', textShadow: '0 0 20px rgba(94,173,63,0.4)' }}>Live Preview</h2>
            <p className="font-sans" style={{ color: 'var(--gray)', fontSize: 14 }}>Prueba la API en tiempo real</p>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', gap: 4, marginBottom: 24 }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'player' && <PlayerLookup />}
          {tab === 'server' && <ServerStatus />}
          {tab === 'utils'  && <ColorCodes />}
        </section>

        <div className="divider" style={{ marginBottom: 56 }} />

        {/* ── Endpoints ── */}
        <section className="anim-fade-up anim-d2">
          <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(90deg, rgba(255,170,0,0.07) 0%, transparent 100%)', borderLeft: '3px solid var(--gold)', borderRadius: '0 4px 4px 0' }}>
            <h2 className="section-title" style={{ marginBottom: 8, textShadow: '0 0 20px rgba(255,170,0,0.4)' }}>Endpoints</h2>
            <p className="font-sans" style={{ color: 'var(--gray)', fontSize: 14 }}>Base URL: <span style={{ color: 'var(--green-l)' }}>https://mctools.liamt.xyz</span></p>
          </div>

          <div className="card">
            {endpoints.map((e, i) => (
              <div key={i} style={{ borderBottom: i < endpoints.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {/* Row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 24px', cursor: 'pointer', transition: 'background .15s' }}
                  onClick={() => setOpenDoc(openDoc === i ? null : i)}
                  onMouseEnter={el => (el.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}
                >
                  <span className={`badge ${e.cls}`} style={{ width: 56, textAlign: 'center', flexShrink: 0, fontSize: 12, padding: '5px 0' }}>{e.method}</span>
                  <span className="font-mono" style={{ flex: 1, color: '#fff', fontSize: 16 }}>{e.path}</span>
                  <span className="font-sans" style={{ color: '#bbb', fontSize: 15 }}>{e.desc}</span>
                  <span style={{ color: 'var(--gray)', fontSize: 14, flexShrink: 0 }}>{openDoc === i ? '▲' : '▼'}</span>
                </div>

                {/* Docs panel */}
                {openDoc === i && (
                  <div className="anim-fade-up" style={{ padding: '0 24px 24px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Params */}
                        {e.params && e.params.length > 0 && (
                          <div>
                            <p className="font-sans" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Parámetros URL</p>
                            {e.params.map(p => (
                              <div key={p.name} style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6 }}>
                                <code style={{ fontFamily: 'monospace', background: '#111', padding: '2px 8px', borderRadius: 2, color: 'var(--aqua)', fontSize: 13, flexShrink: 0 }}>:{p.name}</code>
                                <span style={{ color: 'var(--gray)', fontSize: 12 }}>{p.type}</span>
                                <span className="font-sans" style={{ color: '#ccc', fontSize: 13 }}>{p.desc}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Query */}
                        {'query' in e && e.query && e.query.length > 0 && (
                          <div>
                            <p className="font-sans" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Query params</p>
                            {e.query.map((p: { name: string; type: string; desc: string }) => (
                              <div key={p.name} style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6 }}>
                                <code style={{ fontFamily: 'monospace', background: '#111', padding: '2px 8px', borderRadius: 2, color: 'var(--gold)', fontSize: 13, flexShrink: 0 }}>?{p.name}</code>
                                <span style={{ color: 'var(--gray)', fontSize: 12 }}>{p.type}</span>
                                <span className="font-sans" style={{ color: '#ccc', fontSize: 13 }}>{p.desc}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Body */}
                        {'body' in e && e.body && (
                          <div>
                            <p className="font-sans" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Request body</p>
                            <code style={{ display: 'block', fontFamily: 'monospace', background: '#111', padding: '10px 14px', borderRadius: 2, color: '#ccc', fontSize: 13 }}>{e.body}</code>
                          </div>
                        )}

                        {/* Note */}
                        {'note' in e && e.note && (
                          <div style={{ background: 'rgba(255,170,0,0.07)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 4, padding: '10px 14px' }}>
                            <span className="font-sans" style={{ color: '#ccc', fontSize: 13 }}>ℹ {e.note}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Returns */}
                        <div>
                          <p className="font-sans" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Respuesta</p>
                          <code style={{ display: 'block', fontFamily: 'monospace', background: '#111', padding: '10px 14px', borderRadius: 2, color: 'var(--green-l)', fontSize: 13, lineHeight: 1.8 }}>{e.returns}</code>
                        </div>

                        {/* Example */}
                        <div>
                          <p className="font-sans" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Ejemplo</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111', border: '1px solid var(--border)', borderRadius: 2, padding: '10px 14px' }}>
                            <code style={{ fontFamily: 'monospace', color: '#fff', fontSize: 13, flex: 1 }}>{e.example}</code>
                            <button
                              onClick={() => navigator.clipboard.writeText(`https://mctools.liamt.xyz${e.example.startsWith('POST') ? '' : e.example}`)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
                            >Copiar</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', background: '#080808', marginTop: 40 }}>

        {/* Top strip */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '40px 48px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src="/favicon (2).png" alt="MCTools" style={{ width: 52, height: 52, imageRendering: 'pixelated', flexShrink: 0 }} />
              <div>
                <span className="font-ten" style={{ fontSize: 24, color: '#fff' }}>MC<span style={{ color: 'var(--gold)' }}>Tools</span></span>
                <p className="font-sans" style={{ color: 'var(--gray)', fontSize: 13, marginTop: 4 }}>API pública y gratuita para Minecraft</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="https://mctools.liamt.xyz" target="_blank" rel="noreferrer" style={{ fontFamily: 'Minecraft, monospace', fontSize: 12, background: 'var(--gold)', color: '#111', padding: '10px 20px', borderRadius: 2, textDecoration: 'none', display: 'inline-block' }}>
                Ir a la API →
              </a>
              <a href="https://mctools.liamt.xyz/" target="_blank" rel="noreferrer" style={{ fontFamily: 'Minecraft, monospace', fontSize: 12, background: 'transparent', color: '#fff', padding: '10px 20px', borderRadius: 2, textDecoration: 'none', border: '1px solid var(--border)', display: 'inline-block' }}>
                Documentación
              </a>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40 }}>

          {/* API */}
          <div>
            <p className="font-mc" style={{ color: 'var(--gold)', fontSize: 12, marginBottom: 18, letterSpacing: 1 }}>API</p>
            {[
              { label: 'Inicio',        href: '#' },
              { label: 'Player Lookup', href: '#player' },
              { label: 'Server Status', href: '#server' },
              { label: 'Utilidades',    href: '#utils' },
              { label: 'Endpoints',     href: '#' },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ display: 'block', fontFamily: 'NotoSans, sans-serif', fontSize: 14, color: 'var(--gray)', textDecoration: 'none', marginBottom: 12, transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray)')}
              >{l.label}</a>
            ))}
          </div>

          {/* Recursos */}
          <div>
            <p className="font-mc" style={{ color: 'var(--gold)', fontSize: 12, marginBottom: 18, letterSpacing: 1 }}>Recursos</p>
            {[
              { label: 'Mojang API',     href: 'https://wiki.vg/Mojang_API' },
              { label: 'Minecraft Wiki', href: 'https://minecraft.wiki' },
              { label: 'mc-heads.net',   href: 'https://mc-heads.net' },
              { label: 'Visage',         href: 'https://visage.surgeplay.com' },
              { label: 'mcsrvstat.us',   href: 'https://api.mcsrvstat.us' },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={{ display: 'block', fontFamily: 'NotoSans, sans-serif', fontSize: 14, color: 'var(--gray)', textDecoration: 'none', marginBottom: 12, transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray)')}
              >{l.label} ↗</a>
            ))}
          </div>

          {/* Legal */}
          <div>
            <p className="font-mc" style={{ color: 'var(--gold)', fontSize: 12, marginBottom: 18, letterSpacing: 1 }}>Legal</p>
            {[
              { label: 'Términos de uso' },
              { label: 'Privacidad' },
              { label: 'Cookies' },
              { label: 'Licencia MIT' },
            ].map(l => (
              <a key={l.label} href="#" style={{ display: 'block', fontFamily: 'NotoSans, sans-serif', fontSize: 14, color: 'var(--gray)', textDecoration: 'none', marginBottom: 12, transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray)')}
              >{l.label}</a>
            ))}
          </div>

          {/* Contacto */}
          <div>
            <p className="font-mc" style={{ color: 'var(--gold)', fontSize: 12, marginBottom: 18, letterSpacing: 1 }}>Contacto</p>
            <div style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 2, padding: '14px 16px', marginBottom: 16 }}>
              <p className="font-mono" style={{ color: 'var(--green-l)', fontSize: 11, marginBottom: 4 }}>URL Base</p>
              <p className="font-mono" style={{ color: '#fff', fontSize: 11, wordBreak: 'break-all' }}>mctools.liamt.xyz</p>
            </div>
            <div style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 2, padding: '14px 16px' }}>
              <p className="font-mono" style={{ color: 'var(--green-l)', fontSize: 11, marginBottom: 4 }}>Estado</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-l)', boxShadow: '0 0 6px var(--green-l)', display: 'inline-block' }} className="pulse" />
                <p className="font-mono" style={{ color: '#fff', fontSize: 11 }}>Operativo</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '20px 48px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p className="font-sans" style={{ color: 'var(--gray)', fontSize: 13 }}>
              © 2025 MCTools · Hecho por <span style={{ color: 'var(--gold)' }} className="font-mc">liamt</span> · No afiliado con Mojang o Microsoft
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Términos', 'Privacidad', 'Cookies'].map(l => (
                <a key={l} href="#" style={{ fontFamily: 'NotoSans, sans-serif', fontSize: 13, color: 'var(--gray)', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray)')}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>

      </footer>
    </div>
  )
}
