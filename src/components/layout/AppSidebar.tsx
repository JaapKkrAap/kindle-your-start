import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Flame, MessageSquare, Scroll, Settings, Shield, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

const PLAY_NAV_ITEMS: NavItem[] = [
  { path: '/', icon: Flame, label: 'Discover', description: 'For you' },
  { path: '/sessions', icon: MessageSquare, label: 'Sessions', description: 'Continue' },
  { path: '/settings', icon: Settings, label: 'Settings', description: 'Providers' },
];

const STUDIO_NAV_ITEMS: NavItem[] = [
  { path: '/personas', icon: User, label: 'Personas', description: 'Identity' },
  { path: '/canon', icon: Scroll, label: 'Canon', description: 'Timeline' },
];

const ADMIN_NAV_ITEM: NavItem = { path: '/admin', icon: Shield, label: 'Admin', description: 'System' };

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const studioItems = isAdmin ? [...STUDIO_NAV_ITEMS, ADMIN_NAV_ITEM] : STUDIO_NAV_ITEMS;
  const mobileItems = [...PLAY_NAV_ITEMS, ...studioItems];

  const isItemActive = (path: string) =>
    location.pathname === path ||
    (path === '/sessions' && location.pathname.startsWith('/chat')) ||
    (path !== '/' && location.pathname.startsWith(path));

  const renderDesktopItem = ({ path, icon: Icon, label, description }: NavItem) => {
    const active = isItemActive(path);
    return (
      <Link
        key={path}
        to={path}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
          active
            ? 'bg-primary/12 text-sidebar-foreground ring-1 ring-primary/25'
            : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
        <span className="flex-1 font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground">{description}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 border-r border-sidebar-border/80 bg-sidebar/95 px-3 py-4 md:flex md:flex-col">
        <Link to="/" className="mb-6 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Kindle Your Start</p>
            <p className="text-xs text-muted-foreground">Roleplay studio</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-5">
          <div className="space-y-1">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Play
            </p>
            {PLAY_NAV_ITEMS.map(renderDesktopItem)}
          </div>
          <div className="space-y-1">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Studio
            </p>
            {studioItems.map(renderDesktopItem)}
          </div>
        </nav>

        <div className="rounded-lg border border-sidebar-border/70 bg-background/35 p-3">
          <p className="text-xs font-medium text-sidebar-foreground">Advanced studio</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Personas, canon, and admin tools stay nearby when you want continuity and control.
          </p>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md gap-1" style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }}>
          {mobileItems.map(({ path, icon: Icon, label }) => {
            const active = isItemActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] transition-colors',
                  active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
