import { Skeleton } from '@/components/ui/skeleton';

export function CharacterCardSkeleton() {
  return (
    <div className="premium-card overflow-hidden">
      <div className="aspect-[3/4] bg-muted/50">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className={`flex-1 space-y-2 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className={`h-16 rounded-lg ${isUser ? 'w-3/4' : 'w-4/5'}`} />
      </div>
    </div>
  );
}

export function ChatLoadingSkeleton() {
  return (
    <div className="py-4">
      <MessageSkeleton />
      <MessageSkeleton isUser />
      <MessageSkeleton />
      <MessageSkeleton isUser />
      <MessageSkeleton />
    </div>
  );
}
