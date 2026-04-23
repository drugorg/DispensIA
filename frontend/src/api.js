const API_BASE = 'https://dispensia.onrender.com'

export async function fetchRecipes(userId) {
  const res = await fetch(`${API_BASE}/recipes?user_id=${userId}`)
  if (!res.ok) throw new Error('Errore nel caricamento ricette')
  return res.json()
}

export async function extractRecipe(url, userId) {
  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, user_id: userId }),
  })
  if (!res.ok) throw new Error('Impossibile estrarre la ricetta')
  return res.json()
}

export async function deleteRecipe(recipeId, userId) {
  const res = await fetch(`${API_BASE}/recipes/${recipeId}?user_id=${userId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Errore nella cancellazione')
  return res.json()
}
