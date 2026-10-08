import { cn } from "~/lib/utils";

/** "+18%" in lime, "-12%" in red, nothing when flat. */
export default function Growth({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  if (value === 0) return null;
  return (
    <span
      className={cn(
        "font-semibold",
        value > 0 ? "text-lime" : "text-danger",
        className,
      )}
    >
      {value > 0 ? "+" : "−"}
      {Math.abs(value)}%
    </span>
  );
}
