"use client";

import * as React from "react";
import { Checkbox } from "./ui/Checkbox";
import { Slider } from "./ui/Slider";
import type { FilterOptions } from "../types/Product";

export interface SidebarFilters {
    categories: string[];
    brands: string[];
    colours: string[];
    sizes: string[];
    minPrice: number;
    maxPrice: number;
    onPromotion: boolean;
}

interface FilterSidebarProps {
    value: SidebarFilters;
    onChange: (val: SidebarFilters | ((prev: SidebarFilters) => SidebarFilters)) => void;
    filters?: FilterOptions;
    onApply?: () => void; // deprecated: auto-apply is enabled
    onReset?: () => void;
    // For discrete toggles (checkboxes/chips), immediately apply filter changes (no debounce)
    onChangeImmediate?: (updater: (prev: SidebarFilters) => SidebarFilters) => void;
}

export default function FilterSidebar({ value, onChange, filters, onApply, onReset, onChangeImmediate }: FilterSidebarProps) {
    const isLoading = !filters;

    // Heuristic to determine if a color is dark for text contrast
    const isDarkColor = (c: string): boolean => {
        if (!c) return false;
        const s = c.trim().toLowerCase();
        // Hex formats #rgb, #rgba, #rrggbb, #rrggbbaa
        if (s.startsWith("#")) {
            let hex = s.slice(1);
            if (hex.length === 3 || hex.length === 4) {
                hex = hex
                    .split("")
                    .map((ch) => ch + ch)
                    .join("");
            }
            if (hex.length >= 6) {
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                return luminance < 128;
            }
        }
        // rgb/rgba
        if (s.startsWith("rgb")) {
            const nums = s
                .replace(/rgba?\(/, "")
                .replace(/\)/, "")
                .split(",")
                .map((n) => parseFloat(n.trim()))
                .filter((n) => !Number.isNaN(n));
            if (nums.length >= 3) {
                const [r, g, b] = nums;
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                return luminance < 128;
            }
        }
        // Named colors (rough defaults)
        const darkNames = new Set([
            "black",
            "navy",
            "maroon",
            "purple",
            "olive",
            "teal",
            "brown",
            "indigo",
            "crimson",
            "darkblue",
            "darkred",
            "darkgreen",
            "darkslategray",
            "midnightblue",
            "slategray",
        ]);
        const lightNames = new Set([
            "white",
            "yellow",
            "lightyellow",
            "lightgray",
            "beige",
            "ivory",
            "mintcream",
            "honeydew",
            "seashell",
            "floralwhite",
            "lemonchiffon",
        ]);
        if (darkNames.has(s)) return true;
        if (lightNames.has(s)) return false;
        // Default assume light background
        return false;
    };

    const toggle = (key: keyof SidebarFilters, item: string) => {
        const updater = (prev: SidebarFilters): SidebarFilters => {
            const current = new Set([...(prev[key] as string[] | undefined) ?? []]);
            if (current.has(item)) current.delete(item);
            else current.add(item);
            return { ...prev, [key]: Array.from(current) } as SidebarFilters;
        };
        if (onChangeImmediate) onChangeImmediate(updater);
        else onChange(updater);
    };

    const setMin = (v: number) => {
        onChange((prev) => {
            const max = prev.maxPrice ?? filters?.maxPrice ?? 0;
            return { ...prev, minPrice: Math.min(v, max) };
        });
    };
    const setMax = (v: number) => {
        onChange((prev) => {
            const min = prev.minPrice ?? filters?.minPrice ?? 0;
            return { ...prev, maxPrice: Math.max(v, min) };
        });
    };

    return (
        <aside className="sticky top-14 h-[calc(100vh-56px)] w-72 shrink-0 overflow-y-auto border-r bg-white px-4 py-4 dark:bg-black">
            <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Filters</h2>
            {isLoading && <div className="text-sm text-zinc-500">Loading filters…</div>}

            {/* Categories */}
            <section className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Categories</h3>
                <div className="flex flex-col gap-2">
                    {(filters?.categories ?? []).filter((c) => (filters?.categoryCounts?.[c] ?? 0) > 0 || (value.categories ?? []).includes(c)).map((c) => {
                        const count = filters?.categoryCounts?.[c] ?? 0;
                        const lbl = count ? `${c} (${count})` : c;
                        return (
                            <Checkbox
                                key={c}
                                label={lbl}
                                checked={(value.categories ?? []).includes(c)}
                                onChange={() => toggle("categories", c)}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Brands */}
            <section className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Brands</h3>
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                    {(filters?.brands ?? []).filter((b) => (filters?.brandCounts?.[b] ?? 0) > 0 || (value.brands ?? []).includes(b)).map((b) => {
                        const count = filters?.brandCounts?.[b] ?? 0;
                        const label = count ? `${b} (${count})` : b;
                        return (
                            <Checkbox
                                key={b}
                                label={label}
                                checked={(value.brands ?? []).includes(b)}
                                onChange={() => toggle("brands", b)}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Colours */}
            <section className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Colours</h3>
                <div className="flex flex-wrap gap-2">
                    {(filters?.colours ?? []).filter((col) => (filters?.colourCounts?.[col] ?? 0) > 0 || (value.colours ?? []).includes(col)).map((col) => {
                        const selected = (value.colours ?? []).includes(col);
                        const darkBg = isDarkColor(col);
                        const textClass = darkBg ? "text-white" : "text-black";
                        const count = filters?.colourCounts?.[col] ?? 0;
                        return (
                            <button
                                key={col}
                                onClick={() => toggle("colours", col)}
                                style={{ backgroundColor: col }}
                                className={`rounded border px-2 py-1 text-xs transition-colors ${selected
                                    ? "ring-2 ring-zinc-900 dark:ring-zinc-100"
                                    : ""
                                    } ${darkBg ? "border-zinc-800" : "border-zinc-300 dark:border-zinc-700"}`}
                                title={col}
                            >
                                <span className={`mix-blend-normal ${textClass}`}>{col}{count ? ` (${count})` : ""}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Sizes */}
            <section className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Sizes</h3>
                <div className="flex flex-wrap gap-2">
                    {(filters?.sizes ?? []).filter((s) => (filters?.sizeCounts?.[s] ?? 0) > 0 || (value.sizes ?? []).includes(s)).map((s) => {
                        const count = filters?.sizeCounts?.[s] ?? 0;
                        const label = count ? `${s} (${count})` : s;
                        return (
                            <button
                                key={s}
                                onClick={() => toggle("sizes", s)}
                                className={`rounded border px-2 py-1 text-xs ${(value.sizes ?? []).includes(s)
                                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
                                    : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Price */}
            <section className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Price</h3>
                <div className="space-y-3">
                    <Slider
                        label={`Min (£${value.minPrice || filters?.minPrice || 0})`}
                        min={filters?.minPrice || 0}
                        max={filters?.maxPrice || 0}
                        step={1}
                        value={value.minPrice || filters?.minPrice || 0}
                        onChange={setMin}
                    />
                    <Slider
                        label={`Max (£${value.maxPrice || filters?.maxPrice || 0})`}
                        min={filters?.minPrice || 0}
                        max={filters?.maxPrice || 0}
                        step={1}
                        value={value.maxPrice || filters?.maxPrice || 0}
                        onChange={setMax}
                    />
                </div>
            </section>

            {/* Promotion */}
            {filters?.hasPromotions && (
                <section className="mb-6">
                    <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Promotions</h3>
                    <Checkbox
                        label="On promotion"
                        checked={!!value.onPromotion}
                        onChange={(e) => onChange({ ...value, onPromotion: e.currentTarget.checked })}
                    />
                </section>
            )}
            {/* Actions */}
            <div className="mt-6 flex items-center gap-2">
                <button
                    onClick={onReset}
                    className="w-1/2 rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                    Reset
                </button>
                {/* Apply button intentionally removed: filters auto-apply on change */}
            </div>
        </aside>
    );
}
