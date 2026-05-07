const API_BASE = 'https://dispensia.onrender.com';

export interface Ingredient {
  nome: string;
  quantita: string;
}

export interface Recipe {
  _id: string;
  titolo: string;
  porzioni?: number | null;
  ingredienti: Ingredient[];
  preparazione: string[];
  thumbnail?: string;
  source_url?: string;
  platform?: string;
  author?: string;
  favorite?: boolean;
}

export interface UserStatus {
  tier: 'free' | 'premium';
  extractions_today: number;
  extractions_limit: number;
  extractions_remaining: number;
  bonus_today: number;
  can_get_bonus: boolean;
}

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export async function fetchUserStatus(userId: string): Promise<UserStatus> {
  const res = await fetch(`${API_BASE}/users/me?user_id=${userId}`);
  if (!res.ok) throw new Error('Errore caricamento stato utente');
  return res.json();
}

export async function grantBonusExtraction(userId: string): Promise<UserStatus> {
  const res = await fetch(`${API_BASE}/users/me/grant-bonus?user_id=${userId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.detail || 'Errore concessione bonus');
  }
  const data = await res.json();
  return data as UserStatus;
}

export async function fetchRecipes(userId: string): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/recipes?user_id=${userId}`);
  if (!res.ok) throw new Error('Errore nel caricamento ricette');
  return res.json();
}

export async function extractRecipe(url: string, userId: string, lang = 'it') {
  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, user_id: userId, lang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.detail || 'Impossibile estrarre la ricetta');
  }
  return res.json();
}

export async function toggleFavorite(recipeId: string, userId: string, favorite: boolean) {
  const res = await fetch(
    `${API_BASE}/recipes/${recipeId}/favorite?user_id=${userId}&favorite=${favorite}`,
    { method: 'PATCH' }
  );
  if (!res.ok) throw new Error('Errore preferito');
  return res.json();
}

export async function deleteRecipe(recipeId: string, userId: string) {
  const res = await fetch(`${API_BASE}/recipes/${recipeId}?user_id=${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Errore nella cancellazione');
  return res.json();
}

export async function createRecipe(
  userId: string,
  data: {
    titolo: string;
    ingredienti: Ingredient[];
    preparazione: string[];
    porzioni?: number | null;
    thumbnail?: string;
  }
): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Errore nella creazione');
  }
  return res.json();
}

export async function updateRecipe(
  recipeId: string,
  userId: string,
  data: { titolo: string; ingredienti: Ingredient[]; preparazione: string[] }
) {
  const res = await fetch(`${API_BASE}/recipes/${recipeId}?user_id=${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Errore nel salvataggio');
  return res.json();
}
