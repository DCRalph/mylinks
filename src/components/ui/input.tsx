import type * as React from "react";

import { cn } from "~/lib/utils";

export const fieldClasses =
  "w-full min-w-0 rounded-xl border-[1.5px] border-line bg-bg px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-faint hover:border-faint focus-visible:border-lime focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldClasses, "h-12", className)}
      {...props}
    />
  );
}

/**
 * Input with a fixed prefix inside the field, e.g. the domain in front of a
 * slug: `l2.it/` + `custom-slug`.
 */
function PrefixInput({
  prefix,
  className,
  ...props
}: React.ComponentProps<"input"> & { prefix: string }) {
  return (
    <label
      className={cn(
        fieldClasses,
        "flex h-12 cursor-text items-center gap-0 focus-within:border-lime",
        className,
      )}
    >
      <span className="shrink-0 text-muted select-none">{prefix}</span>
      <input
        data-slot="input"
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint focus-visible:outline-none"
        {...props}
      />
    </label>
  );
}

export { Input, PrefixInput };
