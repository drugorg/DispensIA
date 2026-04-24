import { create } from 'zustand';

interface CartStore {
  cartIds: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  isInCart: (id: string) => boolean;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cartIds: [],
  toggle: (id) => {
    const { cartIds } = get();
    if (cartIds.includes(id)) {
      set({ cartIds: cartIds.filter((x) => x !== id) });
    } else {
      set({ cartIds: [...cartIds, id] });
    }
  },
  remove: (id) => set((s) => ({ cartIds: s.cartIds.filter((x) => x !== id) })),
  isInCart: (id) => get().cartIds.includes(id),
}));
