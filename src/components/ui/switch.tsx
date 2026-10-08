"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] border-line bg-raised transition-colors data-[state=checked]:border-lime data-[state=checked]:bg-lime disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 translate-x-0.5 rounded-full bg-ink transition-transform data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-lime-ink"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
