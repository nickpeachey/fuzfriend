'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    useSearchProductsMutation,
} from "../services/productsApi";
import { Product, ProductSearchRequest } from "../types/Product";
import FilterSidebar from "./FilterSidebar";
import { useGetFiltersQuery } from "../services/productsApi";
import AddToCartButton from "./AddToCartButton";

export default function ProductSearch() {
    // Start with no selected filters so initial request returns all products
    const [sidebarFilters, setSidebarFilters] = useState({
        categories: [] as string[],
        brands: [] as string[],
        colours: [] as string[],
        sizes: [] as string[],
        minPrice: 0,
        maxPrice: 0,
        onPromotion: false,
    });
    const latestFiltersRef = useRef(sidebarFilters);
    useEffect(() => { latestFiltersRef.current = sidebarFilters; }, [sidebarFilters]);
    const searchParams = useSearchParams();
    const [searchProducts, { data, isLoading }] = useSearchProductsMutation();
    const { data: availableFilters } = useGetFiltersQuery();
    const router = useRouter();
    const pathname = usePathname();
    const syncingFromUrl = useRef(false);

    // Paging & sorting state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortBy, setSortBy] = useState("title"); // title | price | rating | brand | category
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const totalCount = data?.totalCount ?? 0;
    const totalPages = useMemo(() => Math.max(1, Math.ceil((totalCount || 0) / pageSize)), [totalCount, pageSize]);

    // Helper: parse arrays from query param (comma-separated)
    const parseArray = (name: string): string[] => {
        const v = searchParams.get(name);
        if (!v) return [];
        return v.split(",").map((s) => s.trim()).filter(Boolean);
    };

    // Track last applied query string to avoid redundant router.replace loops
    const lastQsRef = useRef<string | null>(null);

    // Build URL params from current state (or overrides). Returns the planned href and qs.
    const buildHref = (overrides?: Partial<ProductSearchRequest>, stateOverride?: typeof sidebarFilters) => {
        const params = new URLSearchParams();
        const s = stateOverride ?? latestFiltersRef.current;
        const eff = {
            query: undefined as string | undefined,
            categories: s.categories,
            brands: s.brands,
            colours: s.colours,
            sizes: s.sizes,
            minPrice: s.minPrice,
            maxPrice: s.maxPrice,
            onPromotion: s.onPromotion ? true : undefined,
            page,
            pageSize,
            sortBy,
            sortDirection,
            ...(overrides ?? {}),
        } as ProductSearchRequest;

        if (eff.query && eff.query.trim()) params.set("q", eff.query.trim());
        if (eff.categories && eff.categories.length) params.set("categories", eff.categories.join(","));
        if (eff.brands && eff.brands.length) params.set("brands", eff.brands.join(","));
        if (eff.colours && eff.colours.length) params.set("colours", eff.colours.join(","));
        if (eff.sizes && eff.sizes.length) params.set("sizes", eff.sizes.join(","));
        if (eff.minPrice && eff.minPrice > 0) params.set("minPrice", String(eff.minPrice));
        if (eff.maxPrice && eff.maxPrice > 0) params.set("maxPrice", String(eff.maxPrice));
        if (eff.onPromotion) params.set("onPromotion", "true");
        if (eff.page && eff.page > 1) params.set("page", String(eff.page));
        if (eff.pageSize && eff.pageSize !== 20) params.set("pageSize", String(eff.pageSize));
        if (eff.sortBy && eff.sortBy !== "title") params.set("sortBy", String(eff.sortBy));
        if (eff.sortDirection && eff.sortDirection !== "asc") params.set("sortDirection", String(eff.sortDirection));

        const qs = params.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        return { href, qs };
    };

    // Replace URL only if query string actually changes
    const updateUrl = (overrides?: Partial<ProductSearchRequest>) => {
        const { href, qs } = buildHref(overrides);
        // Compare with last applied; if same, skip replace
        if (lastQsRef.current === qs) return;
        router.replace(href);
        lastQsRef.current = qs;
    };

    // Immediate apply for discrete toggles: update state and URL in one go using the updater
    const applyImmediate = (updater: (prev: typeof sidebarFilters) => typeof sidebarFilters) => {
        // Compute next state from latest, then update the latest ref immediately to avoid stale state on rapid clicks
        const nextState = updater(latestFiltersRef.current);
        latestFiltersRef.current = nextState;
        setSidebarFilters(nextState);
        if (page !== 1) setPage(1);
        const { href, qs } = buildHref({ page: 1 }, nextState);
        if (lastQsRef.current !== qs) {
            router.replace(href);
            lastQsRef.current = qs;
        }
    };

    // React to URL changes: parse state and run search accordingly
    useEffect(() => {
        syncingFromUrl.current = true;
        // arrays: prefer 'categories' if present; else fallback to single 'category'
        const categoriesFromMulti = parseArray("categories");
        const singleCategory = searchParams.get("category") ?? "";
        const categoriesEff = categoriesFromMulti.length ? categoriesFromMulti : (singleCategory ? [singleCategory] : []);
        const queryEff = (searchParams.get("q") ?? "").trim();
        const brandsEff = parseArray("brands");
        const coloursEff = parseArray("colours");
        const sizesEff = parseArray("sizes");
        const minPriceEff = parseFloat(searchParams.get("minPrice") ?? "0") || 0;
        const maxPriceEff = parseFloat(searchParams.get("maxPrice") ?? "0") || 0;
        const onPromotionEff = (searchParams.get("onPromotion") ?? "").toLowerCase() === "true";
        const pageEff = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
        const pageSizeEff = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20;
        const sortByEff = searchParams.get("sortBy") ?? "title";
        const sd = (searchParams.get("sortDirection") ?? "asc").toLowerCase();
        const sortDirectionEff: "asc" | "desc" = sd === "desc" ? "desc" : "asc";

        // Update local state from URL if different
        setSidebarFilters((prev) => ({
            ...prev,
            categories: categoriesEff,
            brands: brandsEff,
            colours: coloursEff,
            sizes: sizesEff,
            // Keep existing min/max if no URL values to avoid wiping initialized bounds
            minPrice: minPriceEff || prev.minPrice,
            maxPrice: maxPriceEff || prev.maxPrice,
            onPromotion: onPromotionEff,
        }));
        setPage(pageEff);
        setPageSize(pageSizeEff);
        setSortBy(sortByEff);
        setSortDirection(sortDirectionEff);

        // Execute search based on parsed URL state
        searchProducts({
            query: queryEff || undefined,
            categories: categoriesEff.length ? categoriesEff : undefined,
            brands: brandsEff.length ? brandsEff : undefined,
            colours: coloursEff.length ? coloursEff : undefined,
            sizes: sizesEff.length ? sizesEff : undefined,
            minPrice: minPriceEff > 0 ? minPriceEff : undefined,
            maxPrice: maxPriceEff > 0 ? maxPriceEff : undefined,
            onPromotion: onPromotionEff ? true : undefined,
            page: pageEff,
            pageSize: pageSizeEff,
            sortBy: sortByEff,
            sortDirection: sortDirectionEff,
        });
        // Update the last applied qs to the current URL to prevent redundant replaces
        lastQsRef.current = searchParams.toString();
        // Allow a tick before enabling auto-apply reactions to avoid loops
        const t = setTimeout(() => { syncingFromUrl.current = false; }, 0);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Initialize sidebar min/max price from available filters once
    useEffect(() => {
        if (!availableFilters) return;
        setSidebarFilters((prev) => {
            const next = { ...prev };
            const needsMin = !prev.minPrice && availableFilters.minPrice;
            const needsMax = !prev.maxPrice && availableFilters.maxPrice;
            if (needsMin) next.minPrice = availableFilters.minPrice;
            if (needsMax) next.maxPrice = availableFilters.maxPrice;
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableFilters?.minPrice, availableFilters?.maxPrice]);

    // Auto-apply: whenever sidebar filters change via user interaction, update URL (debounced) and reset to page 1
    useEffect(() => {
        if (syncingFromUrl.current) return;
        const t = setTimeout(() => {
            if (page !== 1) setPage(1);
            updateUrl({ page: 1 });
        }, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sidebarFilters]);

    const handleReset = () => {
        // Clear local UI state
        setSidebarFilters({
            categories: [],
            brands: [],
            colours: [],
            sizes: [],
            minPrice: 0,
            maxPrice: 0,
            onPromotion: false,
        });
        setSortBy("title");
        setSortDirection("asc");
        setPage(1);
        setPageSize(20);
        // Clear URL query (removes all filters)
        router.replace(pathname);
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-3 lg:col-span-3">
                    <FilterSidebar
                        value={sidebarFilters}
                        onChange={setSidebarFilters}
                        onChangeImmediate={applyImmediate}
                        filters={data?.filters || availableFilters}
                        onReset={handleReset}
                    />
                </div>
                <div className="col-span-12 md:col-span-9 lg:col-span-9">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-zinc-500">{data?.totalCount ?? 0} products</div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-zinc-600 dark:text-zinc-300">Sort by</label>
                                <select
                                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                    value={sortBy}
                                    onChange={(e) => { const v = e.target.value; setSortBy(v); setPage(1); updateUrl({ page: 1, sortBy: v }); }}
                                >
                                    <option value="title">Title</option>
                                    <option value="price">Price</option>
                                    <option value="rating">Rating</option>
                                    <option value="brand">Brand</option>
                                    <option value="category">Category</option>
                                </select>
                                <select
                                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                    value={sortDirection}
                                    onChange={(e) => { const v = e.target.value as "asc" | "desc"; setSortDirection(v); setPage(1); updateUrl({ page: 1, sortDirection: v }); }}
                                >
                                    <option value="asc">Asc</option>
                                    <option value="desc">Desc</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-zinc-600 dark:text-zinc-300">Page size</label>
                                <select
                                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                    value={pageSize}
                                    onChange={(e) => { const n = parseInt(e.target.value, 10) || 20; setPageSize(n); setPage(1); updateUrl({ page: 1, pageSize: n }); }}
                                >
                                    <option value={12}>12</option>
                                    <option value={20}>20</option>
                                    <option value={48}>48</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading && <p>Loading...</p>}
                        {data?.items.map((p: Product) => (
                            <a key={p.id} href={`/products/${p.id}`} className="block rounded border p-2 transition hover:shadow focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700">
                                <img src={p.imageUrl} alt={p.title} className="h-48 w-full rounded object-cover" />
                                <h3 className="mt-2 line-clamp-1 font-semibold" title={p.title}>{p.title}</h3>
                                <p className="line-clamp-2 text-sm text-gray-500" title={p.description}>{p.description}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="font-bold text-blue-600">£{p.price}</p>
                                    <AddToCartButton id={p.id} size="sm" />
                                </div>
                            </a>
                        ))}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                        {(() => {
                            if (totalPages <= 0) return null;
                            const batchSize = 5;
                            // Determine the first page of the current batch.
                            // When you're on the last visible page (multiple of batchSize), show the NEXT batch.
                            let start: number;
                            if (page % batchSize === 0) {
                                start = page + 1;
                            } else {
                                const index = page - 1; // zero-based
                                start = index - (index % batchSize) + 1;
                            }
                            if (start > totalPages) {
                                start = Math.max(1, Math.floor((totalPages - 1) / batchSize) * batchSize + 1);
                            }

                            const end = Math.min(start + batchSize - 1, totalPages);
                            const numbers: number[] = [];
                            for (let i = start; i <= end; i++) numbers.push(i);

                            const Button = ({ n }: { n: number }) => (
                                <button
                                    key={n}
                                    className={`rounded px-3 py-1 text-sm transition-colors ${page === n
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                                            : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                        }`}
                                    onClick={() => { if (n !== page) { setPage(n); updateUrl({ page: n }); } }}
                                >
                                    {n}
                                </button>
                            );

                            return (
                                <>
                                    <button
                                        className={`rounded px-3 py-1 text-sm transition-colors ${page <= 1 ? "opacity-50 cursor-not-allowed border border-zinc-300 dark:border-zinc-700" : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"}`}
                                        disabled={page <= 1}
                                        onClick={() => { if (page > 1) { const n = page - 1; setPage(n); updateUrl({ page: n }); } }}
                                    >
                                        Prev
                                    </button>
                                    {numbers.map((n) => (<Button key={n} n={n} />))}
                                    <button
                                        className={`rounded px-3 py-1 text-sm transition-colors ${page >= totalPages ? "opacity-50 cursor-not-allowed border border-zinc-300 dark:border-zinc-700" : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"}`}
                                        disabled={page >= totalPages}
                                        onClick={() => { if (page < totalPages) { const n = page + 1; setPage(n); updateUrl({ page: n }); } }}
                                    >
                                        Next
                                    </button>
                                    <span className="ml-2 text-sm text-zinc-500">(Page {page} of {totalPages})</span>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
