"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

/** Round icon button that copies `value` and confirms with a toast. */
export default function CopyButton({
  value,
  label = "Copy link",
  icon = <IconCopy />,
  className,
}: {
  value: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied", { description: value });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      className={cn("text-current hover:bg-transparent", className)}
      onClick={copy}
    >
      {copied ? <IconCheck /> : icon}
    </Button>
  );
}
