import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
    Product,
    ProductSearchRequest,
    ProductSearchResponse,
    FilterOptions,
} from "../types/Product";

const rawBaseQuery = fetchBaseQuery({ baseUrl: "http://localhost:5155/api/" });

export const productsApi = createApi({
    reducerPath: "productsApi",
    baseQuery: rawBaseQuery,
    endpoints: (builder) => ({
        // Strict product-by-id that bypasses API cache and corrects mismatches via ids[] search
        getProductByIdStrict: builder.query<Product, number | string>({
            async queryFn(arg, api, extraOptions, baseQuery) {
                const idStr = String(arg);
                const isNumeric = /^\d+$/.test(idStr);
                const commonHeaders: Record<string, string> = {
                    Accept: "application/json",
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                    "X-Bypass-Cache": "1",
                };

                // Numeric ID: GET by id first
                if (isNumeric) {
                    const first = await rawBaseQuery(
                        { url: `Products/${idStr}`, method: "GET", headers: commonHeaders },
                        api,
                        extraOptions
                    );
                    if (first.error) return { error: first.error as any };
                    const prod = first.data as Product;
                    if (!prod) return { error: { status: 404, data: "Not Found" } as any };
                    if (String(prod.id) === idStr) return { data: prod };

                    // Strict fallback: search by ids[]
                    const strict = await rawBaseQuery(
                        {
                            url: `Products/search`,
                            method: "POST",
                            headers: { ...commonHeaders, "Content-Type": "application/json" },
                            body: { ids: [Number(idStr)], page: 1, pageSize: 1 },
                        },
                        api,
                        extraOptions
                    );
                    if (strict.error) return { data: prod };
                    const sdata = strict.data as { products?: Product[]; Products?: Product[] };
                    const items = (sdata?.products ?? sdata?.Products) || [];
                    return { data: items[0] ?? prod };
                }

                // Non-numeric: treat as slug-like, search by query
                const search = await rawBaseQuery(
                    {
                        url: `Products/search`,
                        method: "POST",
                        headers: { ...commonHeaders, "Content-Type": "application/json" },
                        body: { query: idStr, page: 1, pageSize: 1 },
                    },
                    api,
                    extraOptions
                );
                if (search.error) return { error: search.error as any };
                const data = search.data as { products?: Product[]; Products?: Product[] };
                const items = (data?.products ?? data?.Products) || [];
                return items.length ? { data: items[0] } : { error: { status: 404, data: "Not Found" } as any };
            },
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
    useGetProductByIdStrictQuery,
    useGetSuggestionsQuery,
    useSearchProductsMutation,
    useGetCategoriesQuery,
    useGetBrandsQuery,
    useGetColoursQuery,
    useGetSizesQuery,
    useGetFiltersQuery,
} = productsApi;
