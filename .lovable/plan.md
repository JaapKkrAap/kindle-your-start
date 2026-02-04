
# Bot Regeneration Enhancement & User Message Generation

## Overview

This plan implements two major enhancements:
1. **Bot Regeneration Popover** - Extend the regenerate button with options for "Same intent" or custom instruction
2. **User Message Generation Button** - New button in chat input for AI-assisted message creation

---

## Part 1: Bot Regeneration Enhancement

### Current State
The regenerate button (in `ChatMessageBubble.tsx`) is a simple button that calls `onRegenerate(id)` directly. The regeneration logic (in `ChatPage.tsx`) deletes messages from that point and re-generates.

### New Behavior
Replace the button with a popover containing:
- **"Same intent"** - Current default behavior
- **Text input** for custom instruction (e.g., "more concise", "add code examples")

### Implementation

**File: `src/components/chat/ChatMessageBubble.tsx`**

Update the `onRegenerate` prop signature:
```typescript
onRegenerate?: (id: string, instruction?: string) => void;
```

Replace the regenerate button with a popover:
```typescript
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
```

New JSX for regenerate action:
```typescript
{!isUser && onRegenerate && (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
        <RefreshCw className="h-3 w-3 mr-1" />
        Regenerate
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-64 p-3" align="start">
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs h-8"
          onClick={() => onRegenerate(message.id)}
        >
          Same intent
        </Button>
        <div className="relative">
          <Input
            placeholder="Custom instruction..."
            className="h-8 text-xs pr-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                onRegenerate(message.id, e.currentTarget.value.trim());
              }
            }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            Enter
          </span>
        </div>
      </div>
    </PopoverContent>
  </Popover>
)}
```

**File: `src/pages/ChatPage.tsx`**

Update `handleRegenerate` signature:
```typescript
const handleRegenerate = async (id: string, instruction?: string) => {
```

Pass instruction to AI call - modify the messages before sending:
```typescript
const chatHistory = previousMessages.map(m => ({
  role: m.role,
  content: m.content,
}));

// Add regeneration instruction if provided
if (instruction) {
  chatHistory.push({ 
    role: 'user', 
    content: `[Regeneration instruction: ${instruction}]` 
  });
}
```

**File: `supabase/functions/chat/index.ts`**

Add support for regeneration instructions in system prompt:
```typescript
interface ChatRequest {
  // ...existing fields
  regenerateInstruction?: string;
}
```

Modify `buildSystemPrompt` to include instruction handling:
```typescript
if (req.regenerateInstruction) {
  prompt += `\n\n<regeneration_guidance>
For this response, apply the following adjustment: ${req.regenerateInstruction}
</regeneration_guidance>`;
}
```

---

## Part 2: User Message Generation Button

### New Functionality
Add a button (Wand2 icon) next to the input that opens a popover with:
1. **"Generate for me"** - AI creates a suggested user message based on conversation
2. **"Regenerate last message"** - Only visible after user has sent at least one message

### Implementation

**File: `src/components/chat/ChatInput.tsx`**

Update props interface:
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  onGenerateMessage?: () => Promise<string>;
  onRegenerateUserMessage?: (instruction?: string) => Promise<string>;
  hasUserMessages?: boolean;
}
```

Add new imports:
```typescript
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Wand2, Loader2 } from 'lucide-react';
```

Add state for generation:
```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [showGeneratePopover, setShowGeneratePopover] = useState(false);
```

Add generate button UI (between Sparkles button and textarea):
```typescript
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
      
      {hasUserMessages && (
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleRegenerateUserMessage(e.currentTarget.value.trim());
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
```

Add handler functions:
```typescript
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
    textareaRef.current?.focus();
  } catch (error) {
    console.error('Failed to regenerate message:', error);
  } finally {
    setIsGenerating(false);
  }
};
```

**File: `src/pages/ChatPage.tsx`**

Add new handler functions:
```typescript
const handleGenerateUserMessage = async (): Promise<string> => {
  if (!character || !aiSettings) throw new Error('Missing context');
  
  const chatHistory = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));
  
  // Request AI to generate a user message suggestion
  const response = await sendChatMessage({
    messages: [
      ...chatHistory,
      { 
        role: 'system', 
        content: `Based on the conversation so far, generate a suggested response from the user (${activePersona?.name ?? 'the user'}). 
Output ONLY the suggested message text, no meta-commentary or quotes.
Keep it natural and in-character for the user persona.`
      }
    ],
    character,
    persona: activePersona,
    memories: memories?.map(m => m.content) ?? [],
    canonEvents: canonEvents?.map(e => ({
      title: e.title,
      description: e.description,
    })) ?? [],
    settings: aiSettings,
  });
  
  return response.content;
};

const handleRegenerateUserMessage = async (instruction?: string): Promise<string> => {
  if (!character || !aiSettings) throw new Error('Missing context');
  
  // Find the last user message
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMessage) throw new Error('No user message to regenerate');
  
  const chatHistory = messages
    .slice(0, messages.indexOf(lastUserMessage))
    .map(m => ({ role: m.role, content: m.content }));
  
  const instructionText = instruction 
    ? `Apply this adjustment: ${instruction}` 
    : 'Generate a similar message with the same intent';
  
  const response = await sendChatMessage({
    messages: [
      ...chatHistory,
      { 
        role: 'system', 
        content: `The user previously wrote: "${lastUserMessage.content}"
        
${instructionText}

Output ONLY the regenerated message text, no meta-commentary or quotes.`
      }
    ],
    character,
    persona: activePersona,
    memories: memories?.map(m => m.content) ?? [],
    canonEvents: canonEvents?.map(e => ({
      title: e.title,
      description: e.description,
    })) ?? [],
    settings: aiSettings,
  });
  
  return response.content;
};
```

Update ChatInput usage:
```typescript
<ChatInput
  onSend={handleSend}
  isLoading={addMessage.isPending || isTyping}
  placeholder={`Message ${character.name}...`}
  inputRef={chatInputRef}
  onGenerateMessage={handleGenerateUserMessage}
  onRegenerateUserMessage={handleRegenerateUserMessage}
  hasUserMessages={messages.some(m => m.role === 'user')}
/>
```

---

## Part 3: Alternative Approach for Regeneration Instruction

Instead of modifying the edge function, we can inject the instruction directly into the message history as a system-level hint. This keeps the edge function unchanged.

**Modified approach in `handleRegenerate`:**
```typescript
const handleRegenerate = async (id: string, instruction?: string) => {
  if (!sessionId || !character || !aiSettings || isTyping) return;
  
  const messageIndex = messages.findIndex(m => m.id === id);
  if (messageIndex === -1) return;
  
  const targetMessage = messages[messageIndex];
  
  await deleteMessagesAfter.mutateAsync({
    sessionId,
    afterTimestamp: targetMessage.createdAt,
  });
  
  const previousMessages = messages.slice(0, messageIndex);
  
  let chatHistory = previousMessages.map(m => ({
    role: m.role,
    content: m.content,
  }));
  
  // If instruction provided, add as a hint at the end
  if (instruction) {
    chatHistory.push({
      role: 'system',
      content: `[Regeneration guidance: ${instruction}]`,
    });
  }
  
  setIsTyping(true);
  
  try {
    const response = await sendChatMessage({
      messages: chatHistory,
      character,
      persona: activePersona,
      memories: memories?.map(m => m.content) ?? [],
      canonEvents: canonEvents?.map(e => ({
        title: e.title,
        description: e.description,
      })) ?? [],
      settings: aiSettings,
    });
    
    await addMessage.mutateAsync({
      sessionId,
      characterId: character.id,
      personaId: activePersonaId,
      role: 'character',
      content: response.content,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate';
    toast({
      title: 'Regeneration failed',
      description: errorMessage,
      variant: 'destructive',
    });
  } finally {
    setIsTyping(false);
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chat/ChatMessageBubble.tsx` | Add popover for regenerate with "Same intent" + custom input |
| `src/components/chat/ChatInput.tsx` | Add Wand2 button with popover for message generation |
| `src/pages/ChatPage.tsx` | Update handleRegenerate, add generation handlers, pass props |

---

## UI Layout

### Regenerate Popover (Bot Messages)

```text
+---------------------------+
| Same intent               |
+---------------------------+
| [Custom instruction...] ⏎ |
+---------------------------+
```

### Generate Popover (Input Area)

```text
+---------------------------+
| ✨ Generate for me        |
+---------------------------+
| ─── (separator) ───       |
| Regenerate last message   |
+---------------------------+
| Same intent               |
+---------------------------+
| [Custom instruction...] ⏎ |
+---------------------------+
```

---

## Data Flow

### Bot Regeneration with Instruction

```text
1. User clicks Regenerate → Popover opens
   ↓
2. User selects "Same intent" OR types instruction + Enter
   ↓
3. Popover closes automatically
   ↓
4. Messages after target are deleted
   ↓
5. Chat history + optional instruction sent to AI
   ↓
6. New response generated and saved
```

### User Message Generation

```text
1. User clicks Wand2 button → Popover opens
   ↓
2. User clicks "Generate for me"
   ↓
3. AI generates suggested message based on context
   ↓
4. Generated text populates input field
   ↓
5. User can review/edit before sending
   ↓
6. User sends (Enter or click Send)
```

### User Message Regeneration

```text
1. User clicks Wand2 → Popover (shows regenerate option if user has messages)
   ↓
2. User clicks "Same intent" or enters custom instruction
   ↓
3. AI regenerates based on last user message + instruction
   ↓
4. Regenerated text populates input field
   ↓
5. User sends → replaces original message in conversation
```

---

## Technical Details

### Popover Behavior
- Closes on outside click (default Radix behavior)
- Closes after selection/action
- Minimal width (w-64 = 256px)
- Proper z-index via bg-popover class

### Loading States
- Wand2 button shows spinner when generating
- Input and buttons disabled during generation
- Regenerate button shows normal state (parent handles loading)

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Empty conversation | "Generate for me" uses character intro as context |
| No user messages yet | "Regenerate last message" section hidden |
| Generation fails | Error logged, popover stays open for retry |
| Very long generated text | Textarea auto-expands (existing behavior) |
| User edits generated text | Normal flow - user has full control |
