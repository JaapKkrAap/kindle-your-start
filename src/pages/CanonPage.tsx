import { Scroll } from 'lucide-react';

export default function CanonPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Canon Events</h1>
        <p className="mt-1 text-muted-foreground">
          Your confirmed story timeline across all characters
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-muted p-6">
          <Scroll className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold">No canon events yet</h2>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Mark messages as canon during roleplay to build your story timeline.
        </p>
      </div>
    </div>
  );
}
