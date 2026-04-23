import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRecipes, deleteRecipe } from '../api'
import { useCartStore } from '../store/cartStore'

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

export default function HomeScreen({ userId, onOpenRecipe }) {
  const [isListView, setIsListView] = useState(false)
  const qc = useQueryClient()
  const { remove: removeFromCart } = useCartStore()

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', userId],
    queryFn: () => fetchRecipes(userId),
    enabled: !!userId,
    select: data => [...data].reverse(),
  })

  const deleteMut = useMutation({
    mutationFn: ({ id }) => deleteRecipe(id, userId),
    onSuccess: (_, { id }) => {
      removeFromCart(id)
      qc.invalidateQueries(['recipes', userId])
    }
  })

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (confirm('Eliminare questa ricetta?')) deleteMut.mutate({ id })
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="top-bar-logo">Dispens<span>IA</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pill">{recipes.length} ricette</span>
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', borderRadius: 10 }}
            onClick={() => setIsListView(v => !v)}
          >
            {isListView ? <GridIcon /> : <ListIcon />}
          </button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      {isLoading && (
        <div className="empty-state">
          <div className="spin" style={{ fontSize: '1.5rem' }}>⟳</div>
        </div>
      )}

      {!isLoading && recipes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🍲</div>
          <p className="empty-title">Il tuo Vault è vuoto</p>
          <p className="empty-sub">Premi + per aggiungere la tua prima ricetta TikTok</p>
        </div>
      )}

      {!isLoading && recipes.length > 0 && (
        isListView ? (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recipes.map((r, idx) => (
              <div
                key={r._id}
                className="card"
                style={{
                  display: 'flex', gap: 12, padding: '10px', cursor: 'pointer',
                  animation: `fadeUp 0.3s ease ${idx * 0.04}s both`
                }}
                onClick={() => onOpenRecipe(r)}
              >
                {r.thumbnail && (
                  <img src={r.thumbnail} alt={r.titolo} style={{
                    width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0
                  }} />
                )}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>
                    {r.titolo}
                  </span>
                </div>
                <button className="recipe-card-delete" style={{ position: 'static', marginLeft: 4 }}
                  onClick={e => handleDelete(e, r._id)}>✕</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="recipes-grid">
            {recipes.map((r, idx) => (
              <div
                key={r._id}
                className="recipe-card"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => onOpenRecipe(r)}
              >
                <button className="recipe-card-delete" onClick={e => handleDelete(e, r._id)}>✕</button>
                {r.thumbnail
                  ? <img src={r.thumbnail} alt={r.titolo} loading="lazy" />
                  : <div style={{ aspectRatio: '9/16', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🍽️</div>
                }
                <div className="recipe-card-body">
                  <p className="recipe-card-title">{r.titolo}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
