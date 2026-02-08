// @ts-nocheck
import { useState, useMemo } from 'react';
import {
    Search,
    Trash2,
    Pin,
    PinOff,
    Calendar,
    Zap,
    Filter,
    X,
    MessageSquare,
    ChevronDown,
    LayoutGrid,
    Clock
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    useMemories,
    useDeleteMemory,
    useTogglePinMemory
} from '@/hooks/useMemories';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Memory, MemoryCategory } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RelationshipDashboard } from './RelationshipDashboard';

interface MemoriesPanelProps {
    characterId: string;
    personaId?: string;
    trigger?: React.ReactNode;
}

type SortOption = 'importance' | 'date';

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
    fact: 'Fact',
    preference: 'Preference',
    relationship: 'Relationship',
    event: 'Event',
    emotion: 'Emotion',
    goal: 'Goal',
    location: 'Location',
    item: 'Item',
    persona_impression: 'Persona Impression',
    emotional_shift: 'Emotional Shift'
};

const CATEGORY_COLORS: Record<MemoryCategory, string> = {
    fact: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    preference: 'bg-green-500/10 text-green-400 border-green-500/20',
    relationship: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    event: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emotion: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    goal: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    location: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    item: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    persona_impression: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    emotional_shift: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
};

export function MemoriesPanel({ characterId, personaId, trigger }: MemoriesPanelProps) {
    const { data: memories, isLoading } = useMemories(characterId, personaId);
    const deleteMemory = useDeleteMemory();
    const togglePin = useTogglePinMemory();

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('importance');
    const [filterCategory, setFilterCategory] = useState<MemoryCategory | 'all'>('all');

    const filteredAndSortedMemories = useMemo(() => {
        if (!memories) return [];

        const result = memories.filter(m => {
            const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        result.sort((a, b) => {
            // Pinned items always come first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            if (sortBy === 'importance') {
                return b.importance - a.importance;
            } else {
                return b.createdAt.getTime() - a.createdAt.getTime();
            }
        });

        return result;
    }, [memories, searchQuery, sortBy, filterCategory]);

    const groupedMemories = useMemo(() => {
        const groups: Record<string, Memory[]> = {};

        filteredAndSortedMemories.forEach(m => {
            const category = m.category;
            if (!groups[category]) groups[category] = [];
            groups[category].push(m);
        });

        return groups;
    }, [filteredAndSortedMemories]);

    const ImportanceIndicator = ({ score }: { score: number }) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1.5 w-3 rounded-full transition-colors",
                            i < Math.ceil(score / 2)
                                ? "bg-primary"
                                : "bg-muted-foreground/20"
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="relative group">
                        <Zap className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        {memories && memories.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                {memories.length}
                            </span>
                        )}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-background/95 backdrop-blur-xl border-l border-border/50">
                <div className="bg-red-500 text-white text-[10px] font-bold p-1 text-center animate-pulse">
                    DEBUG: Panel Updated - Dashboard should be below
                </div>
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Memories (V2_DEBUG)
                        </SheetTitle>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search memories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    title="Clear search"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-1 border-border/40 bg-muted/20">
                                        <Filter className="h-3.5 w-3.5" />
                                        <span className="text-xs">{filterCategory === 'all' ? 'All Categories' : CATEGORY_LABELS[filterCategory]}</span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuItem onClick={() => setFilterCategory('all')}>
                                        All Categories
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {(Object.keys(CATEGORY_LABELS) as MemoryCategory[]).map(cat => (
                                        <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)}>
                                            {CATEGORY_LABELS[cat]}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-1 border-border/40 bg-muted/20">
                                        {sortBy === 'importance' ? <Zap className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                        <span className="text-xs">Sort by {sortBy === 'importance' ? 'Importance' : 'Date'}</span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => setSortBy('importance')}>
                                        <Zap className="mr-2 h-4 w-4" />
                                        Importance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy('date')}>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Date
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="py-2 space-y-6 pb-12">
                        <div className="text-[10px] text-center text-primary opacity-30 uppercase tracking-widest">--- Dashboard Debug Marker ---</div>
                        <RelationshipDashboard characterId={characterId} personaId={personaId} />

                        {isLoading ? (
                            <div className="space-y-4 pt-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 w-full bg-muted/30 animate-pulse rounded-lg" />
                                ))}
                            </div>
                        ) : filteredAndSortedMemories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                                    <Search className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground font-medium">No memories found</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Try a different search or filter</p>
                            </div>
                        ) : (
                            Object.entries(groupedMemories).map(([category, items]) => (
                                <div key={category} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("px-2 py-0 border-none uppercase tracking-wider text-[10px] font-bold", CATEGORY_COLORS[category as MemoryCategory])}>
                                            {CATEGORY_LABELS[category as MemoryCategory]}
                                        </Badge>
                                        <Separator className="flex-1 opacity-20" />
                                        <span className="text-[10px] font-medium text-muted-foreground/50">{items.length}</span>
                                    </div>

                                    <div className="space-y-3">
                                        {items.map(memory => (
                                            <div
                                                key={memory.id}
                                                className={cn(
                                                    "group relative flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200",
                                                    memory.isPinned
                                                        ? "bg-primary/5 border-primary/20 shadow-sm"
                                                        : "bg-muted/10 border-border/30 hover:border-border/60 hover:bg-muted/20"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                                                        {memory.content}
                                                    </p>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-muted/50 text-muted-foreground hover:text-primary"
                                                            onClick={() => togglePin.mutate({ id: memory.id, isPinned: !memory.isPinned })}
                                                        >
                                                            {memory.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                                            onClick={() => deleteMemory.mutate(memory.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-3">
                                                        <ImportanceIndicator score={memory.importance} />
                                                        {memory.isPinned && (
                                                            <Badge className="bg-primary/20 hover:bg-primary/20 text-primary border-none h-4 px-1 rounded flex items-center gap-0.5 pointer-events-none">
                                                                <Pin className="h-2 w-2 fill-current" />
                                                                <span className="text-[9px] font-bold">PINNED</span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(memory.createdAt, 'MMM d, yyyy')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
