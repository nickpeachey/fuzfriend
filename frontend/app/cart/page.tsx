"use client";

import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { clear, removeOne } from "@/store/cartSlice";
import { useGetProductByIdStrictQuery, productsApi } from "@/services/productsApi";
import type { Product } from "@/types/Product";

function groupCounts(ids: number[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (const id of ids) {
    map[id] = (map[id] ?? 0) + 1;
  }
  return map;
}

function ProductRow({ id, qty, onRemoveOne }: { id: number; qty: number; onRemoveOne: (id: number) => void }) {
  const { data: product, isFetching } = useGetProductByIdStrictQuery(id);
  if (isFetching && !product) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3 dark:border-zinc-800">
        <div className="text-sm text-zinc-500">Loading product #{id}…</div>
        <div className="text-sm text-zinc-500">x{qty}</div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3 dark:border-zinc-800">
        <div className="text-sm text-zinc-500">Product not found (ID {id})</div>
        <div className="text-sm text-zinc-500">x{qty}</div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 dark:border-zinc-800">
      <div className="min-w-0">
        <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
          <Link href={`/products/${product.id}`} prefetch={false} className="hover:underline">
            {product.title}
          </Link>
        </div>
        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{product.brand} • {product.category}</div>
      </div>
      <div className="ml-4 flex items-center gap-3">
        <div className="text-sm text-zinc-700 dark:text-zinc-200">£{product.price.toFixed(2)}</div>
        <div className="text-sm text-zinc-500">x{qty}</div>
        <button
          onClick={() => onRemoveOne(product.id)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Remove one
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const items: number[] = useSelector((s: any) => s.cart?.items ?? []);
  const dispatch = useDispatch();
  const groups = groupCounts(items);
  const uniqueIds = Object.keys(groups).map((k) => Number(k));

  // Compute subtotal by reading RTK Query cache in a single selector (to respect Hooks rules)
  const subtotal = useSelector((state: any) => {
    let sum = 0;
    for (const id of uniqueIds) {
      const sel = productsApi.endpoints.getProductByIdStrict.select(id as any);
      const res = sel(state) as { data?: Product } | undefined;
      const price = res?.data?.price ?? 0;
      sum += price * (groups[id] ?? 0);
    }
    return sum;
  }) as number;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Your basket</h1>
        {items.length > 0 && (
          <button
            onClick={() => dispatch(clear())}
            className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Clear basket
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          Your basket is empty. <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">Continue shopping</Link>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            {uniqueIds.map((id) => (
              <ProductRow key={id} id={id} qty={groups[id] ?? 0} onRemoveOne={(x) => dispatch(removeOne(x))} />
            ))}
          </div>
          <aside className="h-max rounded-lg border p-4 dark:border-zinc-800">
            <div className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">Order summary</div>
            <div className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Taxes and shipping calculated at checkout.</div>
            <button
              className="mt-4 w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
              onClick={() => alert("Checkout flow not implemented.")}
            >
              Checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
