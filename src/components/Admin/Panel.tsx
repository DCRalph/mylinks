import { cn } from "~/lib/utils";

/** A titled panel in the admin console. */
export function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  /** Sits at the right of the title, e.g. a button. */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("bg-panel rounded-2xl p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="display truncate-display min-w-0 text-[28px]">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}
