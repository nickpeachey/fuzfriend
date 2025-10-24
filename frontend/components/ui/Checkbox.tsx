"use client";

import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, ...props }, ref) => {
    return (
      <label className={`flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200 ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="h-4 w-4 appearance-none rounded border border-zinc-300 bg-white text-zinc-900 shadow-sm transition-colors checked:bg-zinc-900 checked:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:bg-zinc-100 dark:checked:text-black"
          {...props}
        />
        {label && <span>{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
