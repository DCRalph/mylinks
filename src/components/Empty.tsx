import { cn } from "~/lib/utils";

/** Big dashed placeholder for empty lists. */
export default function Empty({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line px-6 py-14 text-center",
        className,
      )}
    >
      <p className="display text-4xl">{title}</p>
      {children && <div className="text-muted">{children}</div>}
    </div>
  );
}
