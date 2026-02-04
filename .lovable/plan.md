

# Add Active Persona Visual Indicator

## Overview

Add a visual indicator next to the persona button in the chat header that displays the currently active persona name, making it immediately clear which persona is being used without having to open the dropdown.

## Current State

The persona selector (lines 577-598 in ChatPage.tsx) is currently just an icon button with a User icon:

```tsx
<Button variant="ghost" size="icon" className="h-8 w-8">
  <User className="h-4 w-4" />
</Button>
```

There's no indication of which persona is currently active until the user opens the dropdown.

## Proposed Design

Replace the icon-only button with a button that includes both an icon and the persona name displayed in a badge-style format:

```text
┌─────────────────────────────────────────────────────────┐
│  ←  │        [Avatar] Character Name        │ 📋  👤 You │
└─────────────────────────────────────────────────────────┘
                                               ↑
                                         Persona indicator
```

When a persona is selected:
```text
│ 📋  👤 Knight │
```

When no persona (default):
```text
│ 📋  👤 You │
```

## Implementation

### File: `src/pages/ChatPage.tsx`

**Step 1: Import Badge component**

Add the Badge import at the top of the file:

```typescript
import { Badge } from '@/components/ui/badge';
```

**Step 2: Replace icon button with labeled button**

Change the persona dropdown trigger from a simple icon button to a button that shows the current persona name:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
      <User className="h-4 w-4" />
      <Badge variant="secondary" className="text-xs font-normal">
        {activePersona?.name ?? 'You'}
      </Badge>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="bg-popover">
    {/* ... existing dropdown items ... */}
  </DropdownMenuContent>
</DropdownMenu>
```

## Visual Result

| State | Display |
|-------|---------|
| No persona selected | `👤 You` badge |
| Persona "Knight" selected | `👤 Knight` badge |
| Persona "Shadow" selected | `👤 Shadow` badge |

## Technical Details

- Uses the existing `Badge` component with `secondary` variant for subtle styling
- The `activePersona` variable is already available in the component (line 91)
- Badge styling matches the app's gaming/fantasy aesthetic with muted colors
- Button size changed from `icon` to `sm` to accommodate the text
- Gap and padding adjusted for proper spacing

## Files Modified

| File | Change |
|------|--------|
| `src/pages/ChatPage.tsx` | Add Badge import and update persona button to show active persona name |

