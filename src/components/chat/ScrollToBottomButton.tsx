import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToBottomButton({ visible, onClick }: ScrollToBottomButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={onClick}
            className="rounded-full shadow-lg gap-1 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="text-xs">New messages</span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
