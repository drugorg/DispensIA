import { useState, useEffect } from 'react'
import { useCartStore } from '../store/cartStore'

export default function RecipeModal({ recipe, onClose }) {
  const [checked, setChecked] = useState([])
  const { toggle, isInCart } = useCartStore()
  const inCart = isInCart(recipe._id)

  const toggleIng = (i) => {
    setChecked(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  const pct = recipe.ingredienti?.length
    ? Math.round((checked.length / recipe.ingredienti.length) * 100)
    : 0

  // close on backdrop click
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-inner">

          {/* Thumbnail */}
          {recipe.thumbnail && (
            <div style={{
              width: '100%', height: 200, borderRadius: 16, overflow: 'hidden',
              marginBottom: 18, position: 'relative'
            }}>
              <img src={recipe.thumbnail} alt={recipe.titolo} style={{
                width: '100%', height: '100%', objectFit: 'cover'
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)'
              }} />
              <h2 style={{
                position: 'absolute', bottom: 14, left: 14, right: 14,
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'white'
              }}>{recipe.titolo}</h2>
            </div>
          )}

          {!recipe.thumbnail && (
            <h2 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.4rem', letterSpacing: '-0.03em',
              marginBottom: 18
            }}>{recipe.titolo}</h2>
          )}

          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600 }}>IN DISPENSA</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--accent)' }}>
                {pct === 100 ? '✓ Tutto pronto!' : `${pct}%`}
              </span>
            </div>
            <div className="prog-track">
              <div className="prog-bar" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Hint */}
          <div style={{
            background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 20,
            fontSize: '0.8rem', color: 'var(--accent2)', lineHeight: 1.5
          }}>
            💡 Tocca gli ingredienti che hai già in dispensa per depennarli.
          </div>

          {/* Ingredienti */}
          <h3 style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8
          }}>Ingredienti</h3>
          <div style={{ marginBottom: 24 }}>
            {recipe.ingredienti?.map((ing, i) => (
              <div
                key={i}
                className={`ing-item ${checked.includes(i) ? 'checked' : ''}`}
                onClick={() => toggleIng(i)}
              >
                <span className="ing-name">{ing.nome}</span>
                <span className="ing-qty">{ing.quantita}</span>
              </div>
            ))}
          </div>

          {/* Preparazione */}
          <h3 style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12
          }}>Preparazione</h3>
          <div style={{ marginBottom: 24 }}>
            {recipe.preparazione?.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start'
              }}>
                <span style={{
                  minWidth: 24, height: 24, borderRadius: '50%',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0
                }}>{i + 1}</span>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text2)', paddingTop: 2 }}>{step}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <button
            className="btn-primary"
            style={{ width: '100%', marginBottom: 10, background: inCart ? 'var(--bg3)' : 'var(--accent)', color: inCart ? 'var(--text)' : 'white', border: inCart ? '1px solid var(--border)' : 'none' }}
            onClick={() => toggle(recipe._id)}
          >
            {inCart ? '− Rimuovi dalla spesa' : '+ Aggiungi alla spesa'}
          </button>

          {(recipe.source_url || recipe.url) && (
            <a
              href={recipe.source_url || recipe.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, background: '#1a1a1a', color: 'var(--text2)',
                textDecoration: 'none', padding: '14px', borderRadius: 14,
                fontWeight: 600, fontSize: '0.875rem',
                border: '1px solid var(--border)'
              }}
            >
              ▶ Guarda il video originale
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
