import { Zap, Plus, X, Info } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DIRECTIVE_TEMPLATES,
    NarrativeDirective
} from '@/hooks/useNarrativeDirectives';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';

interface NarrativeDirectivesPopoverProps {
    directives: NarrativeDirective[];
    addFromTemplate: (templateKey: keyof typeof DIRECTIVE_TEMPLATES) => void;
    removeDirective: (id: string) => void;
    maxDirectives?: number;
}

const TEMPLATE_DISPLAY_NAMES: Record<string, string> = {
    buildTension: 'Build Tension',
    revealSecret: 'Reveal Secret',
    pursueGoal: 'Pursue Goal',
    createConflict: 'Create Conflict',
    deepenRelationship: 'Deepen Relationship',
    resolveArc: 'Resolve Arc',
};

export function NarrativeDirectivesPopover({
    directives,
    addFromTemplate,
    removeDirective,
    maxDirectives = 3,
}: NarrativeDirectivesPopoverProps) {
    const isLimitReached = directives.length >= maxDirectives;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 gap-2 px-2 hover:bg-primary/10 transition-colors",
                        directives.length > 0 && "text-primary hover:text-primary"
                    )}
                >
                    <Zap className={cn("h-4 w-4", directives.length > 0 && "fill-current animate-pulse")} />
                    <span className="text-xs font-medium">Directives</span>
                    {directives.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px] font-bold bg-primary/20 text-primary border-none">
                            {directives.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4 bg-background/95 backdrop-blur-xl border-border/50 shadow-xl">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            Narrative Directives
                        </h4>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            {directives.length} / {maxDirectives} ACTIVE
                        </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Directives guide the AI's next response without you having to write explicit instructions.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(DIRECTIVE_TEMPLATES) as Array<keyof typeof DIRECTIVE_TEMPLATES>).map((key) => {
                            const template = DIRECTIVE_TEMPLATES[key];
                            const isAlreadyActive = directives.some(d => d.description === template.description);

                            return (
                                <TooltipProvider key={key}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={isLimitReached || isAlreadyActive}
                                                onClick={() => addFromTemplate(key)}
                                                className={cn(
                                                    "h-9 justify-start gap-2 border-border/40 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 transition-all",
                                                    isAlreadyActive && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <Plus className="h-3 w-3" />
                                                <span className="text-[11px] truncate">{TEMPLATE_DISPLAY_NAMES[key] || key}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-[200px] text-[10px]">
                                            {template.description}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>

                    {directives.length > 0 && (
                        <div className="pt-2 border-t border-border/30 space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active now</p>
                            <div className="flex flex-wrap gap-1.5">
                                {directives.map((d) => (
                                    <Badge
                                        key={d.id}
                                        variant="secondary"
                                        className="pl-2 pr-1 py-0.5 gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                    >
                                        <span className="text-[10px] font-medium leading-none">
                                            {Object.entries(DIRECTIVE_TEMPLATES).find(([_, t]) => t.description === d.description)?.[0]
                                                ? TEMPLATE_DISPLAY_NAMES[Object.entries(DIRECTIVE_TEMPLATES).find(([_, t]) => t.description === d.description)![0]]
                                                : 'Custom'}
                                        </span>
                                        <button
                                            onClick={() => removeDirective(d.id)}
                                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {isLimitReached && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                            <Info className="h-3.5 w-3.5 shrink-0" />
                            <p className="text-[10px] font-medium">Maximum limit reached. Remove one to add a new directive.</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
