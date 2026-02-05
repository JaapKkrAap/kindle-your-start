
# Add Perspective Indicator for Message Generation

## Overview

Add visual indicators to the ChatInput's generation popover that clearly show which perspective (user/persona or character) will be used when generating or regenerating messages. This helps users understand that "Generate for me" writes from their perspective while character message regeneration writes from the character's perspective.

## Visual Design

The popover will display a small badge or label showing the active perspective:

```text
+------------------------------------------+
|  Generate as: [persona icon] "Alex"      |  <-- New header showing active perspective
+------------------------------------------+
|  [Sparkles] Generate for me              |
+------------------------------------------+
|  --- Redo last message ---               |
|  [Same intent]                           |
|  [Custom instruction input...]           |
+------------------------------------------+
```

For the character regeneration popover (on message bubbles), it will show:

```text
+------------------------------------------+
|  Generate as: [User icon] "Luna"         |  <-- Shows character name
+------------------------------------------+
|  [Same intent]                           |
|  [Custom instruction input...]           |
+------------------------------------------+
```

## Implementation Details

### 1. Update ChatInput Component

| Change | Description |
|--------|-------------|
| Add new props | Accept `personaName` and `characterName` to display in the popover |
| Add perspective header | Show "Writing as: [Name]" badge at the top of the popover |
| Visual styling | Use a subtle badge with appropriate icon (User for persona, Users for character) |

### 2. Update ChatMessageBubble Component

| Change | Description |
|--------|-------------|
| Update RegeneratePopover | Accept character name as prop |
| Add perspective header | Show "Writing as: [Character Name]" in the character regeneration popover |

### 3. Pass Props from ChatPage

| Change | Description |
|--------|-------------|
| ChatInput | Pass `personaName` (or "You" if no persona) |
| ChatMessageBubble | Already receives character prop, just use it in RegeneratePopover |

## Technical Implementation

### ChatInput.tsx Changes

```typescript
interface ChatInputProps {
  // ... existing props
  personaName?: string;  // Name of active persona or "You"
}

// In the PopoverContent:
<PopoverContent className="w-56 p-2" align="start">
  <div className="space-y-1">
    {/* New: Perspective indicator */}
    <div className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-md bg-primary/10 border border-primary/20">
      <User className="h-3 w-3 text-primary" />
      <span className="text-xs text-primary font-medium">
        Writing as {personaName || 'You'}
      </span>
    </div>
    
    {/* Existing buttons */}
    <Button>Generate for me</Button>
    ...
  </div>
</PopoverContent>
```

### ChatMessageBubble.tsx Changes

```typescript
// Update RegeneratePopover to show character perspective
function RegeneratePopover({ 
  messageId, 
  characterName,  // Add this prop
  onRegenerate 
}) {
  return (
    <PopoverContent>
      {/* Perspective indicator for character */}
      <div className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-md bg-accent/50 border border-border/50">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">
          Writing as {characterName}
        </span>
      </div>
      ...
    </PopoverContent>
  );
}
```

### ChatPage.tsx Changes

```typescript
// Pass persona name to ChatInput
<ChatInput
  // ... existing props
  personaName={activePersona?.name}
/>

// Pass character name through ChatMessageBubble (already available)
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chat/ChatInput.tsx` | Add `personaName` prop, add perspective indicator in popover |
| `src/components/chat/ChatMessageBubble.tsx` | Pass character name to RegeneratePopover, add perspective indicator |
| `src/pages/ChatPage.tsx` | Pass `personaName` prop to ChatInput |

## Visual Styling

- User perspective: Primary color scheme (lime green accent) with User icon
- Character perspective: Muted/accent color scheme with different icon (e.g., Users or Theatre masks)
- Both indicators use a subtle background with border for visibility without being intrusive

## Expected Result

Users will immediately understand:
1. When clicking the wand icon in the input, they see "Writing as [their persona name]" - confirming the AI will write from their perspective
2. When clicking "Redo" on a character message, they see "Writing as [character name]" - confirming the AI will stay in character
3. This removes confusion about which perspective the generated text will use
