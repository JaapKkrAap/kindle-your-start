import { Info, Shield, Heart, Zap, Star } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRelationshipState } from '@/hooks/useRelationshipState';
import { cn } from '@/lib/utils';

interface RelationshipDashboardProps {
    characterId: string;
    personaId?: string;
}

export function RelationshipDashboard({ characterId, personaId }: RelationshipDashboardProps) {
    const { relationshipState, isLoading } = useRelationshipState(characterId, personaId);

    if (isLoading) {
        return (
            <div className="space-y-4 p-6 animate-pulse bg-muted/5 rounded-xl border border-border/20">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                            <div className="h-4 w-20 bg-muted/20 rounded" />
                            <div className="h-4 w-10 bg-muted/20 rounded" />
                        </div>
                        <div className="h-2 bg-muted/20 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (!relationshipState) return null;

    const metrics = [
        {
            label: 'Trust',
            value: relationshipState.trust,
            icon: Shield,
            description: 'Confidence in your reliability and intentions.',
            invertColor: false,
        },
        {
            label: 'Affection',
            value: relationshipState.affection,
            icon: Heart,
            description: 'Warmth, fondness, and emotional attraction.',
            invertColor: false,
        },
        {
            label: 'Tension',
            value: relationshipState.tension,
            icon: Zap,
            description: 'Conflict, stress, or excitement levels. High tension creates drama.',
            invertColor: true,
        },
        {
            label: 'Respect',
            value: relationshipState.respect,
            icon: Star,
            description: 'Admiration for your character and choices.',
            invertColor: false,
        },
    ];

    const getProgressColor = (value: number, invert: boolean) => {
        // Standard: High = Good (Green), Low = Bad (Red)
        // Inverted: High = Dangerous (Red), Low = Calm (Green)
        if (invert) {
            if (value < 40) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
            if (value < 75) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
            return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
        } else {
            if (value < 30) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
            if (value < 65) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
            return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
        }
    };

    return (
        <div className="p-6 space-y-5 bg-muted/5 rounded-2xl border border-border/20 backdrop-blur-sm">
            <TooltipProvider>
                {metrics.map((metric) => (
                    <div key={metric.label} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-background/50 border border-border/50">
                                    <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/80">{metric.label}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-background/95 backdrop-blur-md border border-border/50">
                                        <p className="text-[11px] font-medium leading-tight max-w-[180px]">{metric.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <span className="text-[10px] font-bold font-mono text-muted-foreground/70 tracking-tighter">
                                {metric.value}%
                            </span>
                        </div>

                        <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden p-[1px]">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000 ease-out", getProgressColor(metric.value, metric.invertColor))}
                                style={{ width: `${metric.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </TooltipProvider>
        </div>
    );
}
