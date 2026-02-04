import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function SessionsPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Sessions</h1>
        <p className="mt-1 text-muted-foreground">
          Your roleplay conversation history
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-muted p-6">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold">No sessions yet</h2>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Start a conversation with a character to create your first session.
        </p>
        <Link to="/">
          <Button className="mt-6 glow-primary">
            Browse Characters
          </Button>
        </Link>
      </div>
    </div>
  );
}
