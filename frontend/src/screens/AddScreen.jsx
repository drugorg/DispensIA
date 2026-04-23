import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { extractRecipe } from '../api'

const PasteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)

const steps = [
  { icon: '📱', label: 'Apri TikTok', sub: 'Trova il video ricetta che ti interessa' },
  { icon: '🔗', label: 'Copia il link', sub: 'Tocca "Condividi" → "Copia link"' },
  { icon: '📋', label: 'Incolla qui', sub: 'Premi Aggiungi e lascia fare all\'AI' },
]

export default function AddScreen({ userId }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState(null) // null | 'success' | 'error'
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => extractRecipe(url, userId),
    onSuccess: () => {
      setStatus('success')
      setUrl('')
      qc.invalidateQueries(['recipes', userId])
      setTimeout(() => setStatus(null), 3500)
    },
    onError: () => {
      setStatus('error')
      setTimeout(() => setStatus(null), 3500)
    },
  })

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setUrl(text)
    } catch {}
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="top-bar-logo">Dispens<span>IA</span></span>
      </div>

      <div style={{ padding: '8px 20px 32px' }}>
        <h1 className="screen-title">Aggiungi ricetta</h1>
        <p className="screen-subtitle">Incolla un link TikTok e l'AI farà il resto</p>
      </div>

      {/* Main input card */}
      <div style={{ padding: '0 16px 28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <label style={{
            display: 'block', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase',
            marginBottom: 10
          }}>Link TikTok</label>

          <div className="input-wrap" style={{ marginBottom: 14 }}>
            <span style={{ color: 'var(--text3)', fontSize: '1rem' }}>🔗</span>
            <input
              className="input-field"
              type="url"
              placeholder="https://vm.tiktok.com/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            <button
              className="btn-ghost"
              style={{ padding: '6px 10px', borderRadius: 8, fontSize: '0.8rem', gap: 4, display: 'flex', alignItems: 'center' }}
              onClick={handlePaste}
              type="button"
            >
              <PasteIcon /> Incolla
            </button>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={() => mut.mutate()}
            disabled={!url.trim() || mut.isPending}
          >
            {mut.isPending ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spin" style={{ display: 'inline-block' }}>⟳</span>
                Analisi in corso...
              </span>
            ) : 'Estrai ricetta'}
          </button>

          {/* Status feedback */}
          {status === 'success' && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(48,217,104,0.1)', border: '1px solid rgba(48,217,104,0.2)',
              color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center',
              animation: 'fadeUp 0.3s ease'
            }}>
              ✓ Ricetta estratta e salvata nel tuo Vault!
            </div>
          )}
          {status === 'error' && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)',
              color: '#ff3b30', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center',
              animation: 'fadeUp 0.3s ease'
            }}>
              ✗ Impossibile estrarre. Controlla il link e riprova.
            </div>
          )}

          {mut.isPending && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)',
              color: 'var(--accent2)', fontSize: '0.8rem', lineHeight: 1.5
            }}>
              🤖 L'AI sta analizzando il video. Potrebbe richiedere 10-30 secondi...
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: '0 16px' }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
          color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4
        }}>Come funziona</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((s, i) => (
            <div key={i} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              animation: `fadeUp 0.4s ease ${i * 0.1}s both`
            }}>
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{s.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{s.sub}</p>
              </div>
              <span style={{
                marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0
              }}>{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
