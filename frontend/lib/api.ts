const API_BASE = 'https://dispensia.onrender.com';

export interface Ingredient {
  nome: string;
  quantita: string;
}

export interface Recipe {
  _id: string;
  titolo: string;
  ingredienti: Ingredient[];
  preparazione: string[];
  thumbnail?: string;
  source_url?: string;
}

export async function fetchRecipes(userId: string): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/recipes?user_id=${userId}`);
  if (!res.ok) throw new Error('Errore nel caricamento ricette');
  return res.json();
}

export async function extractRecipe(url: string, userId: string) {
  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, user_id: userId }),
  });
  if (!res.ok) throw new Error('Impossibile estrarre la ricetta');
  return res.json();
}

export async function deleteRecipe(recipeId: string, userId: string) {
  const res = await fetch(`${API_BASE}/recipes/${recipeId}?user_id=${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Errore nella cancellazione');
  return res.json();
}
