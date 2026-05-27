import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageShellProps {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

export function PageShell({
  title,
  description,
  action,
  meta,
  children,
  maxWidth = 'max-w-7xl',
}: PageShellProps) {
  return (
    <div className="page-shell">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`page-container ${maxWidth}`}
      >
        <header className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {meta && <div className="mb-3">{meta}</div>}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
        {children}
      </motion.div>
    </div>
  );
}
