import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

// Poster buttons: Gobold labels, chunky radii. `icon` is a round outlined button.
const buttonVariants = cva(
  "display inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.1em]",
  {
    variants: {
      variant: {
        default: "bg-lime text-lime-ink hover:bg-lime/85",
        outline:
          "border-[1.5px] border-ink/80 text-ink hover:border-ink hover:bg-ink hover:text-bg",
        secondary: "bg-raised text-ink hover:bg-line",
        ghost: "text-muted hover:bg-raised hover:text-ink",
        destructive:
          "border-[1.5px] border-danger/70 text-danger hover:bg-danger hover:text-lime-ink",
        link: "text-lime underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-lg",
        sm: "h-9 rounded-lg px-3.5 text-base",
        lg: "h-[52px] px-6 text-[22px]",
        icon: "size-9 rounded-full border-[1.5px] border-current/40 text-base hover:border-current",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
