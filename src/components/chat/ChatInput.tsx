import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Wand2, Loader2, Sparkles } from 'lucide-react';

export interface SceneMomentumAction {
  id: string;
  label: string;
  explicit?: boolean;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  onGenerateMessage?: () => Promise<string>;
  onRegenerateUserMessage?: (instruction?: string) => Promise<string>;
  hasUserMessages?: boolean;
  sceneActions?: SceneMomentumAction[];
  onSceneAction?: (actionId: string) => void;
  sceneActionsDisabled?: boolean;
  explicitActionsDisabled?: boolean;
}

export function ChatInput({
  onSend,
  isLoading,
  placeholder,
  inputRef,
  onGenerateMessage,
  onRegenerateUserMessage,
  hasUserMessages,
  sceneActions,
  onSceneAction,
  sceneActionsDisabled,
  explicitActionsDisabled,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showGeneratePopover, setShowGeneratePopover] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalRef;

  const MAX_LENGTH = 2000;
  const showCounter = message.length > MAX_LENGTH * 0.8;

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
    <div className="border-t border-border/60 bg-background/86 p-3 backdrop-blur-xl sm:p-4">
      {sceneActions?.length ? (
        <div className="mx-auto mb-3 flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Scene momentum
          </span>
          <div className="flex flex-wrap gap-2">
            {sceneActions.map(action => {
              const disabled = sceneActionsDisabled || (action.explicit && explicitActionsDisabled);
              return (
                <Button
                  key={action.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-border/70 bg-background/55 px-3 text-xs hover:border-primary/35 hover:bg-primary/10"
                  disabled={disabled}
                  title={action.explicit && explicitActionsDisabled ? 'Switch to OpenRouter or LM Studio for explicit mode' : undefined}
                  onClick={() => onSceneAction?.(action.id)}
                >
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Pill-shaped input container */}
      <div className={cn(
        "pill-input mx-auto flex max-w-3xl items-end gap-2 px-3 py-2 transition-all duration-200",
        isFocused && "ring-2 ring-primary/30 border-primary/50"
      )}>
        {/* Generate message button */}
        {onGenerateMessage && (
          <Popover open={showGeneratePopover} onOpenChange={setShowGeneratePopover}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
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
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder ?? 'Type a message...'}
            className="min-h-[36px] max-h-[120px] resize-none border-0 bg-transparent py-2 text-sm leading-6 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
            rows={1}
          />
          {showCounter && (
            <div className={cn(
              "absolute right-2 top-1 text-[10px] font-medium transition-colors",
              message.length >= MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
            )}>
              {message.length}/{MAX_LENGTH}
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
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
