import { Skeleton } from "../ui/skeleton";

const SkeletonItem = ({ index }: { index: number }) => {
  return (
    <div
      className={`order-zinc-900 hover:bg-zinc-800" group relative flex h-20 w-full flex-1 gap-5 rounded-xl border bg-zinc-900 p-2.5 transition-colors duration-200 hover:border-zinc-600`}
    >
      <div className={`aspect-square h-full rounded-lg`}>
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex w-full flex-col gap-2">
        {index % 3 == 0 && (
          <>
            <Skeleton className="h-6 w-4/12" />
            <Skeleton className="h-4 w-8/12" />
          </>
        )}

        {index % 3 == 1 && (
          <>
            <Skeleton className="h-6 w-6/12" />
            <Skeleton className="h-4 w-4/12" />
          </>
        )}

        {index % 3 == 2 && (
          <>
            <Skeleton className="h-6 w-8/12" />
            <Skeleton className="h-4 w-6/12" />
          </>
        )}
      </div>
    </div>
  );
};

export default SkeletonItem;
