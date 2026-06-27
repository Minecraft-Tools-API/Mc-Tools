import { useState, useEffect } from 'react'
import { fetchColors, encodeText } from '../lib/api'

interface ColorEntry { name: string; hex: string; chat_code: string }
interface FormatEntry { name: string; chat_code: string }
interface ColorsData { colors: Record<string, ColorEntry>; formats: Record<string, FormatEntry> }

const FORMAT_STYLES: Record<string, React.CSSProperties> = {
  '§l': { fontWeight: 'bold' },
  '§o': { fontStyle: 'italic' },
  '§n': { textDecoration: 'underline' },
  '§m': { textDecoration: 'line-through' },
  '§k': { filter: 'blur(3px)' },
}

const MC_COLORS: Record<string, string> = {
  '§0': '#000000', '§1': '#0000AA', '§2': '#00AA00', '§3': '#00AAAA',
  '§4': '#AA0000', '§5': '#AA00AA', '§6': '#FFAA00', '§7': '#AAAAAA',
  '§8': '#555555', '§9': '#5555FF', '§a': '#55FF55', '§b': '#55FFFF',
  '§c': '#FF5555', '§d': '#FF55FF', '§e': '#FFFF55', '§f': '#FFFFFF',
}

function MinecraftText({ text }: { text: string }) {
  const parts: { text: string; color?: string; style?: React.CSSProperties }[] = []
  let i = 0
  let currentColor: string | undefined
  let currentStyle: React.CSSProperties = {}

  while (i < text.length) {
    if (text[i] === '§' && i + 1 < text.length) {
      const code = text[i] + text[i + 1].toLowerCase()
      if (code === '§r') { currentColor = undefined; currentStyle = {} }
      else if (MC_COLORS[code]) { currentColor = MC_COLORS[code] }
      else if (FORMAT_STYLES[code]) { currentStyle = { ...currentStyle, ...FORMAT_STYLES[code] } }
      i += 2
    } else {
      let j = i
      while (j < text.length && text[j] !== '§') j++
      if (j > i) parts.push({ text: text.slice(i, j), color: currentColor, style: currentStyle })
      i = j
    }
  }

  return (
    <span style={{ fontFamily: 'Minecraft, monospace', fontSize: 15 }}>
      {parts.map((p, idx) => (
        <span key={idx} style={{ color: p.color ?? '#fff', ...p.style }}>{p.text}</span>
      ))}
    </span>
  )
}

export default function ColorCodes() {
  const [colorsData, setColorsData] = useState<ColorsData | null>(null)
  const [encodeInput, setEncodeInput] = useState('&aHola &lMundo&r!')
  const [encodeResult, setEncodeResult] = useState<{ encoded: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => { fetchColors().then(setColorsData).catch(() => {}) }, [])

  useEffect(() => {
    if (!encodeInput.trim()) { setEncodeResult(null); return }
    const t = setTimeout(() => { encodeText(encodeInput).then(setEncodeResult).catch(() => {}) }, 400)
    return () => clearTimeout(t)
  }, [encodeInput])

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', background: 'rgba(255,170,0,0.05)', border: '1px solid rgba(255,170,0,0.15)', borderRadius: 4 }}>
        <p className="font-sans" style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>
          Referencia de códigos de color y formato de Minecraft. Haz click en cualquier código para copiarlo.
          Úsalos en MOTDs, plugins, signos y mensajes de servidor.
        </p>
      </div>

      {/* Colors + Formats side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>

        {/* Colors */}
        <div className="card" style={{ padding: 20 }}>
          <p className="font-sans" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 'bold', marginBottom: 14 }}>Colores</p>
          {colorsData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
              {Object.entries(colorsData.colors).map(([key, c]) => (
                <button
                  key={key}
                  onClick={() => copy(c.chat_code, key)}
                  title={`Copiar ${c.chat_code}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#111', border: '1px solid var(--border)', borderRadius: 3,
                    padding: '8px 12px', cursor: 'pointer', transition: 'border-color .15s, background .15s',
                    width: '100%', position: 'relative',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = c.hex; e.currentTarget.style.background = '#1a1a1a' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#111' }}
                >
                  <div style={{ width: 18, height: 18, background: c.hex, flexShrink: 0, borderRadius: 2, border: '1px solid rgba(255,255,255,.1)' }} />
                  <span style={{ color: c.hex, fontSize: 13, flex: 1, textAlign: 'left', fontFamily: 'NotoSans, system-ui' }}>{c.name}</span>
                  <code style={{ fontFamily: 'monospace', color: '#555', fontSize: 11 }}>{c.chat_code}</code>
                  {copied === key && <span style={{ position: 'absolute', right: 8, color: 'var(--green-l)', fontSize: 11 }}>✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="spin" style={{ width: 24, height: 24, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            </div>
          )}
        </div>

        {/* Formats */}
        {colorsData && (
          <div className="card" style={{ padding: 20, minWidth: 200 }}>
            <p className="font-sans" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 'bold', marginBottom: 14 }}>Formatos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(colorsData.formats).map(([key, f]) => {
                const previewStyle = FORMAT_STYLES[f.chat_code] ?? {}
                return (
                  <button
                    key={key}
                    onClick={() => copy(f.chat_code, 'f_' + key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      background: '#111', border: '1px solid var(--border)', borderRadius: 3,
                      padding: '10px 14px', cursor: 'pointer', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <span style={{ fontFamily: 'Minecraft, monospace', fontSize: 13, color: '#fff', ...previewStyle }}>{f.name}</span>
                    <code style={{ fontFamily: 'monospace', color: '#555', fontSize: 11 }}>{f.chat_code}</code>
                    {copied === 'f_' + key && <span style={{ color: 'var(--green-l)', fontSize: 11 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Encoder */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <p className="font-sans" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 'bold' }}>Encoder de colores</p>
          <span className="font-sans" style={{ color: 'var(--gray)', fontSize: 12 }}>
            Usa <code style={{ background: '#111', padding: '1px 6px', borderRadius: 2, color: 'var(--gold)', fontFamily: 'monospace' }}>&amp;</code> en lugar de <code style={{ background: '#111', padding: '1px 6px', borderRadius: 2, color: '#aaa', fontFamily: 'monospace' }}>§</code>
          </span>
        </div>

        <input
          className="mc-input"
          value={encodeInput}
          onChange={e => setEncodeInput(e.target.value)}
          placeholder="&aEscribe &laquí&r con colores..."
          style={{ marginBottom: 12, fontSize: 15 }}
        />

        {encodeResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Live preview */}
            <div style={{ background: '#0a0a0a', border: '1px solid var(--border)', borderRadius: 3, padding: '14px 16px', minHeight: 46 }}>
              <p className="font-sans" style={{ color: '#555', fontSize: 10, marginBottom: 6 }}>PREVIEW</p>
              <MinecraftText text={encodeResult.encoded} />
            </div>

            {/* Output + copy */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="json-block" style={{ flex: 1, maxHeight: 48 }}>{encodeResult.encoded}</div>
              <button className="mc-btn gold" onClick={() => copy(encodeResult.encoded, 'enc')}>
                {copied === 'enc' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
