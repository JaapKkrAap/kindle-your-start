
# Add Relationship Stats to Chat UI

## Overview

Create a compact, always-visible relationship indicator in the chat header that shows the current trust, affection, tension, and respect values. This gives users real-time feedback on how their interactions affect the relationship dynamic without needing to open the Memories panel.

## Visual Design

The indicator will be a compact horizontal bar integrated into the chat header, showing four mini-bars with icons:

```text
+------------------------------------------------------------------+
| [←]   [Avatar] Character Name                   [Controls...]    |
+------------------------------------------------------------------+
| 🛡 ████████░░ 75  ❤ ██████░░░░ 60  ⚡ ███░░░░░░░ 30  ⭐ █████████░ 80 |
+------------------------------------------------------------------+
|                        [Chat messages...]                         |
```

- **Compact inline design**: All four metrics on a single line
- **Color-coded bars**: Green for positive, amber for medium, red for low/danger
- **Tooltips**: Hover to see full metric name and description
- **Collapsible**: Can be toggled on/off via a button to save space

## Implementation

### 1. Create New Component: `RelationshipBar.tsx`

A compact horizontal component optimized for the chat header:

| Element | Description |
|---------|-------------|
| Icons | Shield (trust), Heart (affection), Zap (tension), Star (respect) |
| Mini progress bars | 40px wide, showing percentage fill |
| Value labels | Small numeric percentage beside each bar |
| Tooltips | Full description on hover |
| Color logic | Same as RelationshipDashboard (invert for tension) |

### 2. Update ChatPage Layout

Add the `RelationshipBar` component below the header, above the directives bar:

```text
<header>...</header>

{/* NEW: Relationship stats bar */}
<RelationshipBar 
  characterId={characterId}
  personaId={activePersonaId}
/>

{/* Existing: Narrative directives */}
<AnimatePresence>
  {directives.length > 0 && (...)}
</AnimatePresence>
```

### 3. Optional: Toggle Visibility

Add a small toggle button in the header to show/hide the relationship bar for users who want a cleaner interface. State persisted in localStorage.

## Technical Details

### RelationshipBar Component

```typescript
// src/components/chat/RelationshipBar.tsx

interface RelationshipBarProps {
  characterId: string;
  personaId?: string;
}

export function RelationshipBar({ characterId, personaId }: RelationshipBarProps) {
  const { relationshipState, isLoading } = useRelationshipState(characterId, personaId);
  
  if (isLoading || !relationshipState) return null;
  
  const metrics = [
    { label: 'Trust', value: relationshipState.trust, icon: Shield, invert: false },
    { label: 'Affection', value: relationshipState.affection, icon: Heart, invert: false },
    { label: 'Tension', value: relationshipState.tension, icon: Zap, invert: true },
    { label: 'Respect', value: relationshipState.respect, icon: Star, invert: false },
  ];
  
  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2 bg-background/40 border-b border-border/20">
      {metrics.map(metric => (
        <Tooltip key={metric.label}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <metric.icon className="h-3 w-3 text-muted-foreground" />
              <div className="w-10 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className={getBarColor(metric.value, metric.invert)}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-6">
                {metric.value}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{metric.label}: {metric.value}%</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
```

### Color Logic (reuse from RelationshipDashboard)

```typescript
const getBarColor = (value: number, invert: boolean) => {
  if (invert) {
    if (value < 40) return 'bg-emerald-500';
    if (value < 75) return 'bg-amber-500';
    return 'bg-rose-500';
  } else {
    if (value < 30) return 'bg-rose-500';
    if (value < 65) return 'bg-amber-500';
    return 'bg-emerald-500';
  }
};
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/chat/RelationshipBar.tsx` | Create | New compact relationship indicator component |
| `src/pages/ChatPage.tsx` | Modify | Import and render RelationshipBar below header |

## Styling Details

- **Background**: `bg-background/40 backdrop-blur-sm` to match directives bar
- **Border**: `border-b border-border/20` subtle separator
- **Spacing**: `py-2 px-4` comfortable padding
- **Layout**: Flexbox with `justify-center` and `gap-4` between metrics
- **Animation**: `transition-all duration-500` for smooth bar changes

## Alternative: Header Integration

Instead of a separate bar, the metrics could be integrated directly into the header next to the character avatar. This saves vertical space but may feel cramped on mobile.

## Expected Result

Users will see a subtle but informative bar showing all four relationship metrics at a glance:
- Real-time visual feedback as relationship evolves
- Color coding provides instant understanding (green = good, red = warning)
- Tooltips for users unfamiliar with the metrics
- Unobtrusive design that doesn't distract from the chat
