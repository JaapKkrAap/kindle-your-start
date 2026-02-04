import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const TONE_BUTTONS = [
  { label: 'More dramatic', value: '[Tone: more dramatic]' },
  { label: 'Slow down', value: '[Pace: slower]' },
  { label: 'Be gentle', value: '[Tone: gentle]' },
  { label: 'Get intense', value: '[Tone: intense]' },
];

export function ChatInput({ onSend, isLoading, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showToneButtons, setShowToneButtons] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
      setShowToneButtons(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const appendTone = (tone: string) => {
    setMessage(prev => `${tone} ${prev}`.trim());
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
      {/* Tone buttons */}
      <AnimatePresence>
        {showToneButtons && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mb-3"
          >
            {TONE_BUTTONS.map(btn => (
              <Button
                key={btn.label}
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-muted/50 hover:bg-primary/20 hover:border-primary/50"
                onClick={() => appendTone(btn.value)}
              >
                {btn.label}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* Tone toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={`shrink-0 ${showToneButtons ? 'text-primary' : ''}`}
          onClick={() => setShowToneButtons(!showToneButtons)}
        >
          <Sparkles className="h-5 w-5" />
        </Button>

        {/* Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? 'Continue the story...'}
            className="min-h-[44px] max-h-[200px] resize-none pr-12 bg-muted/30 border-muted focus:border-primary/50"
            disabled={isLoading}
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="shrink-0 glow-primary"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
