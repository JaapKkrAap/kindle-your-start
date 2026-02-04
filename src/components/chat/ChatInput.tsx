import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  onGenerateMessage?: () => Promise<string>;
  onRegenerateUserMessage?: (instruction?: string) => Promise<string>;
  hasUserMessages?: boolean;
}

const TONE_BUTTONS = [
  { label: 'More dramatic', value: '[Tone: more dramatic]' },
  { label: 'Slow down', value: '[Pace: slower]' },
  { label: 'Be gentle', value: '[Tone: gentle]' },
  { label: 'Get intense', value: '[Tone: intense]' },
];

export function ChatInput({ 
  onSend, 
  isLoading, 
  placeholder, 
  inputRef,
  onGenerateMessage,
  onRegenerateUserMessage,
  hasUserMessages 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showToneButtons, setShowToneButtons] = useState(false);
  const [showGeneratePopover, setShowGeneratePopover] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalRef;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message, textareaRef]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
      setShowToneButtons(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Escape to close tone buttons
    if (e.key === 'Escape' && showToneButtons) {
      setShowToneButtons(false);
    }
  };

  const appendTone = (tone: string) => {
    setMessage(prev => `${tone} ${prev}`.trim());
    textareaRef.current?.focus();
  };

  const handleGenerateMessage = async () => {
    if (!onGenerateMessage) return;
    setIsGenerating(true);
    try {
      const generated = await onGenerateMessage();
      setMessage(generated);
      setShowGeneratePopover(false);
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to generate message:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateUserMessage = async (instruction?: string) => {
    if (!onRegenerateUserMessage) return;
    setIsGenerating(true);
    try {
      const generated = await onRegenerateUserMessage(instruction);
      setMessage(generated);
      setShowGeneratePopover(false);
      setCustomInstruction('');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to regenerate message:', error);
    } finally {
      setIsGenerating(false);
    }
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

        {/* Generate message button */}
        {onGenerateMessage && (
          <Popover open={showGeneratePopover} onOpenChange={setShowGeneratePopover}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                disabled={isLoading || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="h-5 w-5" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={handleGenerateMessage}
                  disabled={isGenerating}
                >
                  <Sparkles className="h-3 w-3 mr-2" />
                  Generate for me
                </Button>
                
                {hasUserMessages && onRegenerateUserMessage && (
                  <>
                    <div className="border-t border-border/50 my-2" />
                    <p className="text-[10px] text-muted-foreground px-2">Regenerate last message</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => handleRegenerateUserMessage()}
                      disabled={isGenerating}
                    >
                      Same intent
                    </Button>
                    <div className="relative">
                      <Input
                        placeholder="Custom instruction..."
                        className="h-8 text-xs pr-8"
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customInstruction.trim()) {
                            handleRegenerateUserMessage(customInstruction.trim());
                          }
                        }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        Enter
                      </span>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

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

      {/* Keyboard hints */}
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/50">
        <span><kbd className="px-1 py-0.5 bg-muted/50 rounded text-[9px]">Enter</kbd> to send</span>
        <span><kbd className="px-1 py-0.5 bg-muted/50 rounded text-[9px]">Shift+Enter</kbd> new line</span>
      </div>
    </div>
  );
}
