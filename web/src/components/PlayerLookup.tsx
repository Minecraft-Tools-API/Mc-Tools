import { useState, useRef } from 'react'
import { fetchPlayer } from '../lib/api'
import SkinViewer from './SkinViewer'

interface PlayerProfile {
  uuid: string; uuid_dashed: string; name: string
  skin: { url: string; model: string } | null
  cape: { url: string } | null
  head_render: string; body_render: string
}

export default function PlayerLookup() {
  const [input, setInput] = useState('')
  const [data, setData] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jsonOpen, setJsonOpen] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lookup = (name: string) => {
    if (!name.trim()) { setData(null); setError(null); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true); setError(null)
      try { setData(await fetchPlayer(name.trim())) }
      catch (e) { setError((e as Error).message); setData(null) }
      finally { setLoading(false) }
    }, 700)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <input
          className="mc-input"
          style={{ fontSize: 18, padding: '18px 22px', paddingRight: 52 }}
          placeholder="Nombre de jugador..."
          value={input}
          onChange={e => { setInput(e.target.value); lookup(e.target.value) }}
        />
        {loading && (
          <div className="spin" style={{
            position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
            width: 20, height: 20, border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%',
          }} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '14px 20px', background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)', borderRadius: 4 }}>
          <span className="font-sans" style={{ color: '#ff6b6b', fontSize: 15 }}>✖ {error}</span>
        </div>
      )}

      {/* Result */}
      {data && (
        <div className="card anim-fade-up" style={{ overflow: 'visible' }}>

          {/* Header banner */}
          <div style={{
            background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
            borderBottom: '1px solid var(--border)',
            padding: '28px 32px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <img
              src={data.head_render}
              alt={data.name}
              width={72} height={72}
              style={{ imageRendering: 'pixelated', border: '2px solid var(--border)', borderRadius: 4, flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <h2 className="font-ten" style={{ fontSize: 32, color: '#fff', marginBottom: 10 }}>{data.name}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge green" style={{ fontSize: 12, padding: '4px 12px' }}>{data.skin?.model ?? 'classic'}</span>
                {data.cape && <span className="badge aqua" style={{ fontSize: 12, padding: '4px 12px' }}>Cape ✓</span>}
                <span className="badge gold" style={{ fontSize: 12, padding: '4px 12px' }}>Java Edition</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {data.skin && (
                <a href={data.skin.url} target="_blank" rel="noreferrer"
                  className="mc-btn"
                  style={{ fontSize: 12, padding: '10px 18px', background: 'transparent', border: '1px solid var(--border)', color: '#ccc', textDecoration: 'none' }}>
                  Ver skin ↗
                </a>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0 }}>

            {/* Left — 3D viewer */}
            <div style={{ borderRight: '1px solid var(--border)', padding: 24, display: 'flex', justifyContent: 'center' }}>
              {data.skin ? (
                <SkinViewer skinUrl={data.skin.url} capeUrl={data.cape?.url} name={data.name} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}>
                  <img src={data.head_render} alt={data.name} width={120} height={120} style={{ imageRendering: 'pixelated' }} />
                  <span className="font-sans" style={{ color: 'var(--gray)', fontSize: 13 }}>Skin por defecto</span>
                </div>
              )}
            </div>

            {/* Right — Info */}
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* UUID */}
              <div style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px' }}>
                <p className="font-mc" style={{ color: 'var(--gray)', fontSize: 10, marginBottom: 8, letterSpacing: 1 }}>UUID</p>
                <p className="font-mono" style={{ color: 'var(--aqua)', fontSize: 14, wordBreak: 'break-all', lineHeight: 1.8 }}>{data.uuid_dashed}</p>
              </div>

              {/* Skin URL */}
              {data.skin && (
                <div style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px' }}>
                  <p className="font-mc" style={{ color: 'var(--gray)', fontSize: 10, marginBottom: 8, letterSpacing: 1 }}>SKIN URL</p>
                  <a href={data.skin.url} target="_blank" rel="noreferrer"
                    className="font-mono"
                    style={{ color: 'var(--green-l)', fontSize: 12, wordBreak: 'break-all', lineHeight: 1.8, textDecoration: 'none' }}>
                    {data.skin.url}
                  </a>
                </div>
              )}

              {/* Cape URL */}
              {data.cape && (
                <div style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px' }}>
                  <p className="font-mc" style={{ color: 'var(--gray)', fontSize: 10, marginBottom: 8, letterSpacing: 1 }}>CAPE URL</p>
                  <a href={data.cape.url} target="_blank" rel="noreferrer"
                    className="font-mono"
                    style={{ color: 'var(--aqua)', fontSize: 12, wordBreak: 'break-all', lineHeight: 1.8, textDecoration: 'none' }}>
                    {data.cape.url}
                  </a>
                </div>
              )}

              {/* JSON collapsible */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <button
                  onClick={() => setJsonOpen(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', background: '#111', border: 'none', cursor: 'pointer',
                  }}>
                  <span className="font-mc" style={{ color: 'var(--gray)', fontSize: 10, letterSpacing: 1 }}>RESPUESTA JSON</span>
                  <span style={{ color: 'var(--gold)', fontSize: 16 }}>{jsonOpen ? '▲' : '▼'}</span>
                </button>
                {jsonOpen && (
                  <div className="json-block" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--border)', fontSize: 12, maxHeight: 220 }}>
                    {JSON.stringify(data, null, 2)}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {!data && !error && !loading && (
        <div className="card" style={{ padding: 56, textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🎮</p>
          <p className="font-ten" style={{ color: 'var(--gray)', fontSize: 18 }}>Busca un jugador</p>
          <p className="font-sans" style={{ color: '#555', fontSize: 14, marginTop: 8 }}>Escribe cualquier nombre de Minecraft</p>
        </div>
      )}
    </div>
  )
}
