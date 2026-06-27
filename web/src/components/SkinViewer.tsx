import { useEffect, useRef, useState } from 'react'
import * as skinview3d from 'skinview3d'

interface Props {
  skinUrl: string
  capeUrl?: string | null
  name: string
}

const ANIMATIONS = [
  { id: 'idle', label: 'Idle', cls: skinview3d.IdleAnimation },
  { id: 'walk', label: 'Walk', cls: skinview3d.WalkingAnimation },
  { id: 'run',  label: 'Run',  cls: skinview3d.RunningAnimation },
  { id: 'wave', label: 'Wave', cls: skinview3d.WaveAnimation },
  { id: 'fly',  label: 'Fly',  cls: skinview3d.FlyingAnimation },
  { id: 'swim', label: 'Swim', cls: skinview3d.SwimAnimation },
]

type ViewMode = '3d' | 'skin' | 'cape'

function SkinPreview({ skinUrl, name, onDownload }: { skinUrl: string; name: string; onDownload: () => void }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        background: 'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 0 0 / 20px 20px',
        border: '1px solid var(--border)', borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        <img
          src={skinUrl}
          alt={`${name} skin`}
          style={{ imageRendering: 'pixelated', width: '100%', aspectRatio: '1 / 1', objectFit: 'contain' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-sans" style={{ color: 'var(--gray)', fontSize: 12 }}>Textura · 64×64px</span>
        <button className="mc-btn gold" onClick={onDownload} style={{ fontSize: 10, padding: '8px 16px' }}>
          ↓ Descargar
        </button>
      </div>
    </div>
  )
}

function CapePreview({ capeUrl, name, onDownload }: { capeUrl: string; name: string; onDownload: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = capeUrl
    img.onload = () => {
      // Cape front face: x=1, y=1, w=10, h=16 (in a 64×32 texture)
      const scale = img.width / 64
      const sx = 1 * scale, sy = 1 * scale
      const sw = 10 * scale, sh = 16 * scale

      canvas.width = 200
      canvas.height = 320
      ctx.clearRect(0, 0, 200, 320)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 200, 320)
    }
  }, [capeUrl])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        background: 'repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 0 0 / 20px 20px',
        border: '1px solid var(--border)', borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 420, overflow: 'hidden',
      }}>
        <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', maxWidth: '90%', maxHeight: '90%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-sans" style={{ color: 'var(--gray)', fontSize: 12 }}>Cara frontal de la capa</span>
        <button className="mc-btn gold" onClick={onDownload} style={{ fontSize: 10, padding: '8px 16px' }}>
          ↓ Descargar
        </button>
      </div>
    </div>
  )
}

export default function SkinViewer({ skinUrl, capeUrl, name }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<skinview3d.SkinViewer | null>(null)
  const [animId, setAnimId] = useState('walk')
  const [zoom, setZoom] = useState(0.5)
  const [capeVisible, setCapeVisible] = useState(!!capeUrl)
  const [autoRotate, setAutoRotate] = useState(false)
  const [mode, setMode] = useState<ViewMode>('3d')

  // Resetear modo si el nuevo jugador no tiene lo que está seleccionado
  useEffect(() => {
    if (mode === 'cape' && !capeUrl) setMode('3d')
    setCapeVisible(!!capeUrl)
  }, [capeUrl, skinUrl])

  useEffect(() => {
    if (!canvasRef.current) return
    const viewer = new skinview3d.SkinViewer({
      canvas: canvasRef.current,
      width: 260,
      height: 420,
    })
    viewer.renderer.setClearColor(0x000000, 0)
    viewer.zoom = zoom
    viewer.autoRotate = false
    viewer.loadSkin(skinUrl).catch(() => {})
    if (capeUrl) viewer.loadCape(capeUrl).catch(() => {})
    viewer.animation = new skinview3d.WalkingAnimation()
    viewerRef.current = viewer

    // Leer zoom DESPUÉS de que el viewer lo procese
    const readZoom = () => requestAnimationFrame(() => {
      if (viewerRef.current) setZoom(parseFloat(viewerRef.current.zoom.toFixed(2)))
    })

    const canvas = canvasRef.current!
    canvas.addEventListener('wheel', readZoom, { passive: true })
    canvas.addEventListener('touchmove', readZoom, { passive: true })

    return () => {
      canvas.removeEventListener('wheel', readZoom)
      canvas.removeEventListener('touchmove', readZoom)
      viewer.dispose()
    }
  }, [skinUrl, capeUrl])

  useEffect(() => {
    if (!viewerRef.current) return
    const found = ANIMATIONS.find(a => a.id === animId)
    if (found) viewerRef.current.animation = new found.cls()
  }, [animId])

  useEffect(() => {
    if (!viewerRef.current) return
    viewerRef.current.zoom = zoom
  }, [zoom])

  useEffect(() => {
    if (!viewerRef.current) return
    viewerRef.current.playerObject.cape.visible = capeVisible
  }, [capeVisible])

  useEffect(() => {
    if (!viewerRef.current) return
    viewerRef.current.autoRotate = autoRotate
  }, [autoRotate])

  const download = (url: string, filename: string) => {
    fetch(url).then(r => r.blob()).then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
    }).catch(() => window.open(url, '_blank'))
  }

  const MODES: { id: ViewMode; label: string }[] = [
    { id: '3d',   label: '3D' },
    { id: 'skin', label: 'Skin' },
    ...(capeUrl ? [{ id: 'cape' as ViewMode, label: 'Capa' }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 260 }}>

      {/* Mode tabs */}
      <div style={{ display: 'flex', width: '100%', background: '#111', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              flex: 1, padding: '7px', fontSize: 10, cursor: 'pointer',
              fontFamily: 'Minecraft, monospace',
              background: mode === m.id ? 'var(--bg3)' : 'transparent',
              color: mode === m.id ? '#fff' : 'var(--gray)',
              border: 'none',
              borderBottom: `2px solid ${mode === m.id ? 'var(--gold)' : 'transparent'}`,
              transition: 'all .15s',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 3D Viewer — siempre en DOM, solo se oculta */}
      <div style={{ display: mode === '3d' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
        <div style={{
          background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%)',
          border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden',
          position: 'relative', cursor: 'grab',
        }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          <p style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: '#333', fontFamily: 'NotoSans, sans-serif', pointerEvents: 'none' }}>
            drag · scroll zoom
          </p>
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', width: '100%' }}>
          {ANIMATIONS.map(a => (
            <button key={a.id} onClick={() => setAnimId(a.id)} style={{
              flex: '1 1 auto', fontSize: 9, padding: '6px 4px', cursor: 'pointer',
              fontFamily: 'Minecraft, monospace', borderRadius: 2,
              background: animId === a.id ? 'var(--green)' : '#1a1a1a',
              color: animId === a.id ? '#fff' : 'var(--gray)',
              border: `1px solid ${animId === a.id ? 'var(--green)' : 'var(--border)'}`,
              transition: 'all .15s',
            }}>{a.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <span style={{ fontSize: 9, color: 'var(--gray)', fontFamily: 'Minecraft, monospace', flexShrink: 0 }}>Zoom</span>
          <input type="range" min="0.2" max="1.5" step="0.05" value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--gold)', cursor: 'pointer' }} />
        </div>

        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <button onClick={() => setAutoRotate(v => !v)} style={{
            flex: 1, fontSize: 9, padding: '7px', cursor: 'pointer',
            fontFamily: 'Minecraft, monospace', borderRadius: 2,
            background: autoRotate ? 'rgba(255,170,0,.1)' : '#1a1a1a',
            color: autoRotate ? 'var(--gold)' : 'var(--gray)',
            border: `1px solid ${autoRotate ? 'var(--gold)' : 'var(--border)'}`,
            transition: 'all .15s',
          }}>
            {autoRotate ? '↻ Girando' : '↻ Auto-rotar'}
          </button>
          {capeUrl && (
            <button onClick={() => setCapeVisible(v => !v)} style={{
              flex: 1, fontSize: 9, padding: '7px', cursor: 'pointer',
              fontFamily: 'Minecraft, monospace', borderRadius: 2,
              background: capeVisible ? 'rgba(85,255,255,.08)' : '#1a1a1a',
              color: capeVisible ? 'var(--aqua)' : 'var(--gray)',
              border: `1px solid ${capeVisible ? 'var(--aqua)' : 'var(--border)'}`,
              transition: 'all .15s',
            }}>
              {capeVisible ? '✓ Capa' : '✗ Capa'}
            </button>
          )}
        </div>
      </div>

      {/* Skin 2D */}
      {mode === 'skin' && (
        <SkinPreview skinUrl={skinUrl} name={name} onDownload={() => download(skinUrl, `${name}_skin.png`)} />
      )}

      {/* Cape 2D */}
      {mode === 'cape' && capeUrl && (
        <CapePreview capeUrl={capeUrl} name={name} onDownload={() => download(capeUrl, `${name}_cape.png`)} />
      )}
    </div>
  )
}
