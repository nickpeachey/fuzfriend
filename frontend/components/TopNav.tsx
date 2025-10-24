"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetCategoriesQuery } from "../services/productsApi";
import { useMemo, useState } from "react";

export default function TopNav() {
  const { data: categories, isLoading } = useGetCategoriesQuery();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get("category") ?? "";

  const [q, setQ] = useState(searchParams.get("q") ?? "");

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
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q && q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    params.delete("page"); // reset to first page on new search
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/60 dark:bg-black/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left: Logo/Brand placeholder */}
          <div className="flex items-center gap-3">
            <Link href={pathname} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" prefetch={false}>
              FuzFriend
            </Link>

            {/* Mega Menu: Categories */}
            <div className="group relative">
              <button className="rounded px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Categories
              </button>
              <div className="invisible absolute left-0 top-full z-50 mt-2 w-screen max-w-3xl translate-y-2 rounded-md border bg-white p-6 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:bg-zinc-900">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Link
                    href={buildHrefWithCategory("")}
                    className={`block rounded px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${activeCategory === "" ? "font-semibold" : ""}`}
                    prefetch={false}
                  >
                    All
                  </Link>
                  {isLoading && (
                    <span className="text-sm text-zinc-500">Loading categories…</span>
                  )}
                  {categories?.map((cat) => (
                    <Link
                      key={cat}
                      href={buildHrefWithCategory(cat)}
                      prefetch={false}
                      className={`block rounded px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                        activeCategory === cat ? "font-semibold" : ""
                      }`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Search */}
          <form onSubmit={onSearchSubmit} className="flex w-full max-w-xl items-center gap-2">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
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
