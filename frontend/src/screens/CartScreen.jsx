import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRecipes } from '../api'
import { useCartStore } from '../store/cartStore'

export default function CartScreen({ userId, onOpenRecipe }) {
  const { cartIds, toggle } = useCartStore()
  const [checkedItems, setCheckedItems] = useState({})

  const { data: allRecipes = [] } = useQuery({
    queryKey: ['recipes', userId],
    queryFn: () => fetchRecipes(userId),
    enabled: !!userId,
  })

  const cartRecipes = allRecipes.filter(r => cartIds.includes(r._id))

  const toggleItem = (recipeId, ingIdx) => {
    const key = `${recipeId}-${ingIdx}`
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const totalItems = cartRecipes.reduce((sum, r) => sum + (r.ingredienti?.length || 0), 0)
  const checkedCount = Object.values(checkedItems).filter(Boolean).length

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="top-bar-logo">Dispens<span>IA</span></span>
        {cartRecipes.length > 0 && (
          <span className="pill">{checkedCount}/{totalItems} ingredienti</span>
        )}
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        <h1 className="screen-title">Lista Spesa</h1>
        <p className="screen-subtitle">Spunta mentre metti nel carrello</p>
      </div>

      {cartRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p className="empty-title">Lista vuota</p>
          <p className="empty-sub">Apri una ricetta dal tuo Vault e premi "Aggiungi alla spesa"</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Progress overall */}
          {totalItems > 0 && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.05em' }}>PROGRESSO SPESA</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: checkedCount === totalItems ? 'var(--green)' : 'var(--accent)' }}>
                  {checkedCount === totalItems ? '✓ Fatto!' : `${Math.round(checkedCount / totalItems * 100)}%`}
                </span>
              </div>
              <div className="prog-track">
                <div className="prog-bar" style={{ width: `${totalItems ? (checkedCount / totalItems * 100) : 0}%` }} />
              </div>
            </div>
          )}

          {cartRecipes.map((r, ri) => (
            <div key={r._id} className="card" style={{
              overflow: 'hidden', animation: `fadeUp 0.3s ease ${ri * 0.07}s both`
            }}>
              {/* Recipe header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {r.thumbnail && (
                    <img src={r.thumbnail} alt={r.titolo} style={{
                      width: 36, height: 36, borderRadius: 8, objectFit: 'cover'
                    }} />
                  )}
                  <span
                    style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                    onClick={() => onOpenRecipe(r)}
                  >{r.titolo}</span>
                </div>
                <button
                  onClick={() => toggle(r._id)}
                  style={{
                    background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)',
                    color: '#ff3b30', borderRadius: 8, padding: '4px 8px',
                    fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >Rimuovi</button>
              </div>

              {/* Ingredients */}
              <div style={{ padding: '4px 16px 8px' }}>
                {r.ingredienti?.map((ing, i) => {
                  const key = `${r._id}-${i}`
                  const done = !!checkedItems[key]
                  return (
                    <div
                      key={i}
                      className={`ing-item ${done ? 'checked' : ''}`}
                      onClick={() => toggleItem(r._id, i)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          border: done ? 'none' : '1.5px solid var(--text3)',
                          background: done ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}>
                          {done && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
                        </div>
                        <span className="ing-name">{ing.nome}</span>
                      </div>
                      <span className="ing-qty">{ing.quantita}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
