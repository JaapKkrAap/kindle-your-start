import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  characterName: string;
}

export function TypingIndicator({ characterName }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-4 py-3"
    >
      {/* Animated dots container */}
      <div className="h-11 w-11 rounded-full bg-accent/60 border border-border/50 flex items-center justify-center">
        <div className="flex gap-1">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
          />
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </div>
      <span className="text-sm text-muted-foreground">
        {characterName} is typing...
      </span>
    </motion.div>
  );
}
