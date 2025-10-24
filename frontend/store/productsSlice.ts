import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "../types/Product";

interface ProductsState {
    items: Product[];
    totalCount: number;
    isLoading: boolean;
    categories: string[];
    brands: string[];
    colours: string[];
    sizes: string[];
    error?: string;
}

const initialState: ProductsState = {
    items: [],
    totalCount: 0,
    isLoading: false,
    categories: [],
    brands: [],
    colours: [],
    sizes: [],
};

const productsSlice = createSlice({
    name: "products",
    initialState,
    reducers: {
        setProducts: (
            state,
            action: PayloadAction<{ items: Product[]; totalCount: number }>
        ) => {
            state.items = action.payload.items;
            state.totalCount = action.payload.totalCount;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | undefined>) => {
            state.error = action.payload;
        },
    },
});

export const { setProducts, setLoading, setError } = productsSlice.actions;
export default productsSlice.reducer;
