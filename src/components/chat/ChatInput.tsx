import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Wand2, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  onGenerateMessage?: () => Promise<string>;
  onRegenerateUserMessage?: (instruction?: string) => Promise<string>;
  hasUserMessages?: boolean;
}

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
  const [showGeneratePopover, setShowGeneratePopover] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalRef;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message, textareaRef]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    <div className="p-4 bg-background/60 backdrop-blur-sm">
      {/* Pill-shaped input container */}
      <div className="pill-input flex items-end gap-2 px-3 py-2">
        {/* Generate message button */}
        {onGenerateMessage && (
          <Popover open={showGeneratePopover} onOpenChange={setShowGeneratePopover}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                disabled={isLoading || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-1">
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
                    <p className="text-[10px] text-muted-foreground px-2 py-1">Redo last message</p>
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
                        ↵
                      </span>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Type a message...'}
          className="flex-1 min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2 text-sm placeholder:text-muted-foreground/60"
          disabled={isLoading}
          rows={1}
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="icon"
          className="shrink-0 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="mt-2 flex justify-center">
        <span className="text-[10px] text-muted-foreground/40">
          Press Enter to send • Shift+Enter for new line
        </span>
      </div>
    </div>
  );
}
