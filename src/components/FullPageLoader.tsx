import { Skeleton } from './ui/skeleton';
export function FullPageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Skeleton className="h-24 w-24 rounded-full" />
    </div>
  );
}