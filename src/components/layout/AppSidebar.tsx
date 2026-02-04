import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users, User, MessageSquare, Settings, BookOpen, Scroll } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Users, label: 'Characters' },
  { path: '/personas', icon: User, label: 'Personas' },
  { path: '/sessions', icon: MessageSquare, label: 'Sessions' },
  { path: '/canon', icon: Scroll, label: 'Canon' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-border/50 bg-sidebar py-4">
      {/* Logo */}
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
        <BookOpen className="h-5 w-5 text-white" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path));

          return (
            <Link key={path} to={path}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 transition-all',
                  isActive
                    ? 'bg-primary/20 text-primary glow-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                title={label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
