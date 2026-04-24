import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  cartIds: [],
  toggle: (id) => {
    const { cartIds } = get()
    if (cartIds.includes(id)) {
      set({ cartIds: cartIds.filter(x => x !== id) })
    } else {
      set({ cartIds: [...cartIds, id] })
    }
  },
  remove: (id) => set(s => ({ cartIds: s.cartIds.filter(x => x !== id) })),
  isInCart: (id) => get().cartIds.includes(id),
}))
