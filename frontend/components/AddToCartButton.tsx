"use client";
import React from "react";
import { useDispatch } from "react-redux";
import { add } from "@/store/cartSlice";

export default function AddToCartButton({ id, size = "md", onAdded }: { id: number; size?: "sm" | "md"; onAdded?: () => void }) {
  const dispatch = useDispatch();
  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dispatch(add(id));
    onAdded?.();
  };
  const cls = size === "sm"
    ? "rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    : "rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200";
  return (
    <button onClick={handleClick} className={cls} aria-label="Add to cart">
      {size === "sm" ? "Add" : "Add to cart"}
    </button>
  );
}
