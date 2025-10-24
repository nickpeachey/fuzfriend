import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
    Product,
    ProductSearchRequest,
    ProductSearchResponse,
    FilterOptions,
} from "../types/Product";

export const productsApi = createApi({
    reducerPath: "productsApi",
    baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5155/api/" }),
    endpoints: (builder) => ({
        getProductById: builder.query<Product, number>({
            query: (id: number) => ({
                url: `Products/${id}`,
                method: "GET",
                headers: { Accept: "application/json" },
            }),
        }),
        getSuggestions: builder.query<Product[], { query: string; limit?: number }>({
            query: ({ query, limit = 8 }) => ({
                url: "Products/search",
                method: "POST",
                body: {
                    query,
                    page: 1,
                    pageSize: limit,
                    sortBy: "title",
                    sortDirection: "asc",
                },
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }),
            transformResponse: (response: { products: Product[] }) => response.products ?? [],
        }),
        searchProducts: builder.mutation<ProductSearchResponse, ProductSearchRequest>({
            query: (body) => ({
                url: "Products/search",
                method: "POST",
                body,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }),
            transformResponse: (response: { products: Product[]; totalCount: number; filters?: FilterOptions }) => ({
                items: response.products,
                totalCount: response.totalCount,
                filters: response.filters,
            }),
        }),
        // The backend does not expose separate endpoints for categories/brands/colours/sizes.
        // We fetch the default product listing (GET /api/Products) and map out filter options.
        getCategories: builder.query<string[], void>({
            query: () => ({ url: "Products", method: "GET", headers: { Accept: "application/json" } }),
            transformResponse: (response: { filters?: FilterOptions }) => response.filters?.categories ?? [],
        }),
        getBrands: builder.query<string[], void>({
            query: () => ({ url: "Products", method: "GET", headers: { Accept: "application/json" } }),
            transformResponse: (response: { filters?: FilterOptions }) => response.filters?.brands ?? [],
        }),
        getColours: builder.query<string[], void>({
            query: () => ({ url: "Products", method: "GET", headers: { Accept: "application/json" } }),
            transformResponse: (response: { filters?: FilterOptions }) => response.filters?.colours ?? [],
        }),
        getSizes: builder.query<string[], void>({
            query: () => ({ url: "Products", method: "GET", headers: { Accept: "application/json" } }),
            transformResponse: (response: { filters?: FilterOptions }) => response.filters?.sizes ?? [],
        }),
        getFilters: builder.query<FilterOptions, void>({
            query: () => ({ url: "Products", method: "GET", headers: { Accept: "application/json" } }),
            transformResponse: (response: { filters?: FilterOptions }) => ({
                categories: response.filters?.categories ?? [],
                brands: response.filters?.brands ?? [],
                colours: response.filters?.colours ?? [],
                sizes: response.filters?.sizes ?? [],
                minPrice: response.filters?.minPrice ?? 0,
                maxPrice: response.filters?.maxPrice ?? 0,
                ratings: response.filters?.ratings ?? [],
                hasPromotions: response.filters?.hasPromotions ?? false,
            }),
        }),
    }),
});

export const {
    useGetProductByIdQuery,
    useGetSuggestionsQuery,
    useSearchProductsMutation,
    useGetCategoriesQuery,
    useGetBrandsQuery,
    useGetColoursQuery,
    useGetSizesQuery,
    useGetFiltersQuery,
} = productsApi;
