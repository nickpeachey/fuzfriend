"use client";

import * as React from "react";

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  label?: string;
}

export function Slider({ min = 0, max = 100, step = 1, value, onChange, label }: SliderProps) {
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
          <span>{label}</span>
          <span className="tabular-nums">{value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded bg-zinc-200 accent-zinc-900 dark:bg-zinc-800 dark:accent-zinc-100"
      />
    </div>
  );
}
