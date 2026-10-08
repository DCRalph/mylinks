"use client";

import { cn } from "~/lib/utils";

const SWATCHES = [
  "#c8f560",
  "#f4f4ee",
  "#7dd3fc",
  "#a78bfa",
  "#f9a8d4",
  "#ff6b5b",
  "#ff9f1a",
  "#4ade80",
];

/** A row of swatches plus a custom colour input. */
export default function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SWATCHES.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={value.toLowerCase() === color}
          onClick={() => onChange(color)}
          className={cn(
            "size-9 cursor-pointer rounded-full ring-1 ring-white/10 ring-inset",
            value.toLowerCase() === color &&
              "outline-2 outline-offset-2 outline-lime",
          )}
          style={{ background: color }}
        />
      ))}
      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-line pr-3 pl-1 text-sm text-muted hover:border-faint">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
        />
        Custom
      </label>
    </div>
  );
}
