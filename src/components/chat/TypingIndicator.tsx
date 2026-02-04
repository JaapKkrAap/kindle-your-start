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
      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
        <div className="flex gap-1">
          <motion.div
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
      <span className="text-sm text-muted-foreground italic">
        {characterName} is composing...
      </span>
    </motion.div>
  );
}
