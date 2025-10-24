import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartState {
  items: number[]; // product IDs; duplicates represent multiple quantities
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setFromCookie(state, action: PayloadAction<number[] | undefined>) {
      state.items = Array.isArray(action.payload) ? action.payload.filter((n) => Number.isFinite(n)) : [];
    },
    add(state, action: PayloadAction<number>) {
      const id = Number(action.payload);
      if (Number.isFinite(id)) state.items.push(id);
    },
    removeOne(state, action: PayloadAction<number>) {
      const id = Number(action.payload);
      const idx = state.items.indexOf(id);
      if (idx >= 0) state.items.splice(idx, 1);
    },
    clear(state) {
      state.items = [];
    },
  },
});

export const { setFromCookie, add, removeOne, clear } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartCount = (state: any) => (state.cart?.items?.length ?? 0) as number;
