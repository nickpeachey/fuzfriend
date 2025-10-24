"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetCategoriesQuery, useGetSuggestionsQuery } from "../services/productsApi";
import { useEffect, useMemo, useRef, useState } from "react";

export default function TopNav() {
  const { data: categories, isLoading } = useGetCategoriesQuery();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  // Always send listing/search links to the home page rather than the current route
  const listingPath = "/";
  // Determine selected categories from URL (multi takes precedence over single)
  const multi = (searchParams.get("categories") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single = (searchParams.get("category") ?? "").trim();
  const selectedCategories = multi.length ? multi : (single ? [single] : []);
  const isSelected = (cat: string) => selectedCategories.includes(cat);
  const isAllSelected = selectedCategories.length === 0;

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce search text for suggestions
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const shouldSuggest = debouncedQ.trim().length >= 2;
  const { data: suggestions = [], isFetching: fetchingSuggestions } = useGetSuggestionsQuery(
    { query: debouncedQ.trim(), limit: 8 },
    { skip: !shouldSuggest }
  );
  const [suggestOpen, setSuggestOpen] = useState(false);

  const preservedParams = useMemo(() => {
    // Copy current params except category/categories and page
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("categories");
    params.delete("page");
    return params;
  }, [searchParams]);

  const buildHrefWithCategory = (cat?: string) => {
    const params = new URLSearchParams(preservedParams.toString());
    if (cat && cat.length) {
      params.set("categories", cat);
    } else {
      // Clear categories
      params.delete("categories");
    }
    const qs = params.toString();
    return qs ? `${listingPath}?${qs}` : listingPath;
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If there's exactly one product suggestion, go straight to its product page
    if (suggestions.length === 1) {
      setSuggestOpen(false);
      setQ(suggestions[0].title);
      router.replace(`/products/${suggestions[0].id}`);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (q && q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    params.delete("page"); // reset to first page on new search
    const qs = params.toString();
    router.replace(qs ? `${listingPath}?${qs}` : listingPath);
    setSuggestOpen(false);
  };

  // Keyboard shortcut: '/' focuses the search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || e.isComposing;
      if (!isTyping && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
  <nav className="sticky top-0 z-40 w-full border-b border-zinc-200/60 bg-linear-to-b from-white/80 to-white/60 backdrop-blur supports-backdrop-filter:bg-white/60 shadow-sm dark:border-zinc-800/60 dark:from-black/50 dark:to-black/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Logo/Brand placeholder */}
          <div className="flex items-center gap-4">
            <Link href={listingPath} className="bg-linear-to-r from-zinc-900 to-zinc-600 bg-clip-text text-base font-semibold text-transparent dark:from-zinc-100 dark:to-zinc-400" prefetch={false}>
              FuzFriend
            </Link>

            {/* Mega Menu: Categories */}
            <div className="group relative">
              <button className="rounded px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Categories
              </button>
              <div className="pointer-events-none invisible absolute left-0 top-full z-50 mt-2 w-screen max-w-4xl translate-y-2 rounded-xl border border-zinc-200/70 bg-white/95 p-6 opacity-0 shadow-xl ring-1 ring-black/5 backdrop-blur-md transition-all group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-zinc-800/70 dark:bg-zinc-900/95">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Browse categories</div>
                  <Link href={buildHrefWithCategory("")} prefetch={false} className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">View all</Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {/* All tile */}
                  <Link
                    href={buildHrefWithCategory("")}
                    className={`group/item flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${isAllSelected ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : ""}`}
                    prefetch={false}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-zinc-200 to-zinc-100 text-zinc-700 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-200">★</span>
                    <span className="truncate">All</span>
                  </Link>
                  {isLoading && (
                    <div className="col-span-full text-sm text-zinc-500">Loading categories…</div>
                  )}
                  {categories?.map((cat) => (
                    <Link
                      key={cat}
                      href={buildHrefWithCategory(cat)}
                      prefetch={false}
                      className={`group/item flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${isSelected(cat) ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : ""}`}
                      title={cat}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-zinc-200 to-zinc-100 text-zinc-700 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-200">
                        {cat.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="truncate">{cat}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Search */}
          <form onSubmit={onSearchSubmit} className="relative flex w-full max-w-xl items-center gap-2">
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span>
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => { setQ(e.target.value); setSuggestOpen(true); }}
                onFocus={() => { if (shouldSuggest) setSuggestOpen(true); }}
                onBlur={() => { setTimeout(() => setSuggestOpen(false), 120); }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setSuggestOpen(false); }
                }}
                placeholder="Search products… (press / to focus)"
                className="w-full rounded-full border border-zinc-300 bg-white pl-9 pr-9 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              {q?.length ? (
                <button
                  type="button"
                  onClick={() => { setQ(""); inputRef.current?.focus(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              ) : null}

              {/* Suggestions dropdown */}
              {suggestOpen && (shouldSuggest || fetchingSuggestions) && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-zinc-200/70 bg-white/95 p-2 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-900/95">
                  {fetchingSuggestions && (
                    <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
                  )}
                  {!fetchingSuggestions && suggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-zinc-500">No results</div>
                  )}
                  <ul className="max-h-80 overflow-auto">
                    {/* Collections section derived from suggestions */}
                    {(() => {
                      const cats = Array.from(new Set(suggestions.map((s) => s.category))).filter(Boolean);
                      if (cats.length === 0) return null;
                      return (
                        <div className="pb-2">
                          <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Collections</div>
                          <ul className="mb-2 grid grid-cols-2 gap-1">
                            {cats.slice(0, 6).map((cat) => (
                              <li key={cat}>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setSuggestOpen(false);
                                    setQ(cat);
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set("categories", cat);
                                    params.delete("page");
                                    const qs = params.toString();
                                    router.replace(qs ? `${listingPath}?${qs}` : listingPath);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-linear-to-br from-zinc-200 to-zinc-100 text-[10px] font-semibold text-zinc-700 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-200">
                                    {cat.slice(0, 2).toUpperCase()}
                                  </span>
                                  <span className="truncate">{cat}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}

                    {/* Products section */}
                    <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Products</div>
                    {suggestions.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setQ(p.title);
                            setSuggestOpen(false);
                            router.replace(`/products/${p.id}`);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-linear-to-br from-zinc-200 to-zinc-100 text-xs font-semibold text-zinc-700 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-200">
                            {p.title.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">{p.title}</div>
                            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{p.brand} • £{p.price}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 sm:inline-flex dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              Search
            </button>
          </form>

          {/* Right: placeholder for future items */}
          <div className="min-w-12" />
        </div>
      </div>
    </nav>
  );
}
