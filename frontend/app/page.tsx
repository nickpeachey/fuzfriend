import ProductSearch from "@/components/ProductSearch";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-7xl px-4 pt-20">
        <Suspense fallback={<div className="p-4 text-sm text-zinc-500">Loading products…</div> }>
          <ProductSearch />
        </Suspense>
      </div>
    </div>
  );
}
