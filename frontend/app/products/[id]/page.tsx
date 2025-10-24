import React from "react";
import type { Product } from "@/types/Product";
import { notFound } from "next/navigation";

// Ensure this page is always rendered dynamically with no caching between IDs
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function normalizeApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5155/api";
  const trimmed = raw.replace(/\/+$/, "");
  if (/\/api$/.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
}

type ProductWithDebug = { product: Product | null; debug: { requestedId: string; returnedId?: string | null; cacheStatus?: string | null; serverStrictFix?: string | null } };

async function fetchProduct(id: string): Promise<ProductWithDebug> {
  const base = normalizeApiBase();
  try {
    if (!id || !String(id).trim()) {
      return { product: null, debug: { requestedId: String(id ?? ""), returnedId: null, cacheStatus: null, serverStrictFix: null } };
    }
    const isNumeric = /^\d+$/.test(id);
    // Prefer fresh data for product detail to avoid wrong caching across IDs.
    // Add a tiny timestamp to fully bust any intermediate caches.
    const ts = Date.now();
    if (isNumeric) {
      const res = await fetch(`${base}/Products/${id}?_ts=${ts}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "X-Bypass-Cache": "1",
      },
    });
      if (res.ok) {
        const cacheStatus = res.headers.get("x-cache-status");
        const returnedIdHeader = res.headers.get("x-returned-id");
        const requestedIdHeader = res.headers.get("x-requested-id");
        const strictFix = res.headers.get("x-server-strict-fix");
        const prod: Product = await res.json();
        // If backend returns a different product id (shouldn't happen), try strict search by ids[]
        if (String(prod.id) !== String(id)) {
          const strict = await fetch(`${base}/Products/search`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
              "X-Bypass-Cache": "1",
            },
            body: JSON.stringify({ ids: [Number(id)], page: 1, pageSize: 1 }),
            cache: "no-store",
          });
          if (strict.ok) {
            const sdata = await strict.json();
            const items: Product[] | undefined = sdata?.products ?? sdata?.Products ?? [];
            if (items && items.length) return { product: items[0], debug: { requestedId: id, returnedId: String(items[0].id), cacheStatus, serverStrictFix: strictFix } };
          }
        }
        return { product: prod, debug: { requestedId: id, returnedId: returnedIdHeader ?? String(prod.id), cacheStatus, serverStrictFix: strictFix } };
      }
    }
    // Fallback: when id is non-numeric, try searching by the id as a query (slug-like)
    if (!isNumeric) {
      const search = await fetch(`${base}/Products/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "X-Bypass-Cache": "1",
        },
        body: JSON.stringify({ query: String(id), page: 1, pageSize: 1 }),
        cache: "no-store",
      });
  if (!search.ok) return { product: null, debug: { requestedId: id, returnedId: null, cacheStatus: null, serverStrictFix: null } };
      const data = await search.json();
      const items: Product[] | undefined = data?.products ?? data?.Products ?? [];
      const item = items && items.length ? items[0] : null;
      return { product: item, debug: { requestedId: id, returnedId: item ? String(item.id) : null, cacheStatus: null, serverStrictFix: null } };
    }
    return { product: null, debug: { requestedId: id, returnedId: null, cacheStatus: null, serverStrictFix: null } };
  } catch {
    return { product: null, debug: { requestedId: id, returnedId: null, cacheStatus: null, serverStrictFix: null } };
  }
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id?: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) {
  const p = await params;
  const spMaybe = searchParams as any;
  const sp: Record<string, string | string[] | undefined> = spMaybe && typeof spMaybe.then === "function" ? await spMaybe : (spMaybe || {});
  const getFirst = (v: string | string[] | undefined): string | undefined => Array.isArray(v) ? v[0] : v;
  const requestedId = p?.id ?? getFirst(sp["id"]) ?? getFirst(sp["pid"]) ?? "";
  if (!requestedId || !String(requestedId).trim()) {
    return notFound();
  }
  const { product, debug } = await fetchProduct(requestedId);
  if (!product) return notFound();

  const images = (product as any).imageUrls as string[] | undefined; // backend property casing is ImageUrls
  const gallery = images && images.length ? images : [product.imageUrl].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          {gallery?.length ? (
            <div className="space-y-3">
              <img src={gallery[0]} alt={product.title} className="aspect-square w-full rounded object-cover" />
              {gallery.slice(1).length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {gallery.slice(1, 5).map((g, i) => (
                    <img key={i} src={g} alt={`${product.title} ${i + 2}`} className="aspect-square w-full rounded object-cover" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700">No image</div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{product.title}</h1>
          <div className="mt-1 text-xs text-zinc-400">Requested ID: {debug.requestedId || "(none)"} • Product ID: {debug.returnedId ?? product.id}</div>
          {debug.cacheStatus && (
            <div className="mt-1 text-[10px] text-zinc-400">Cache: {debug.cacheStatus}{debug.serverStrictFix ? ` • StrictFix: ${debug.serverStrictFix}` : ""}</div>
          )}
          <div className="mt-2 text-sm text-zinc-500">{product.brand} • {product.category}</div>
          <div className="mt-4 text-2xl font-semibold text-blue-600">£{product.price}</div>
          <div className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">{product.description}</div>
          <div className="mt-6 flex gap-2 text-sm">
            <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">Color: {product.color}</span>
            <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">Size: {product.size}</span>
            <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">Rating: {product.rating}</span>
          </div>
          <div className="mt-8 flex gap-2">
            <button className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200">Add to cart</button>
            <button className="rounded border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Add to wishlist</button>
          </div>
        </div>
      </div>
    </div>
  );
}
