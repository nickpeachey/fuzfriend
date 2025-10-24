import { makeStore } from "../lib/store";
import { productsApi } from "../../services/productsApi";
import type { Product } from "../../types/Product";

// Server-side helper to run RTK Query without hooks and return the data directly
export async function getProductByIdStrictServer(id: string | number): Promise<Product | null> {
  const idStr = String(id ?? "");
  if (!idStr.trim()) return null;
  const store = makeStore();

  // Dispatch the query without subscribing, then read from the selector
  const action = productsApi.endpoints.getProductByIdStrict.initiate(idStr, { subscribe: false }) as any;
  await store.dispatch(action);
  const select = productsApi.endpoints.getProductByIdStrict.select(idStr);
  const state = store.getState();
  const { data } = select(state) as { data?: Product };
  action?.unsubscribe?.();
  return data ?? null;
}
