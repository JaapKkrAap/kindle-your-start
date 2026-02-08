// @ts-nocheck
import { useRelationshipState } from '@/hooks/useRelationshipState';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Heart, Shield, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelationshipDashboardProps {
    characterId: string;
    personaId?: string;
}

export function RelationshipDashboard({ characterId, personaId }: RelationshipDashboardProps) {
    const { data: state, isLoading } = useRelationshipState(characterId, personaId);

    if (isLoading) {
        return (
            <div className="space-y-4 p-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 bg-muted rounded-md" />
                ))}
            </div>
        );
    }

    // Default to 0 if no state exists
    const data = state || {
        trust: 0,
        affection: 0,
        tension: 0,
        respect: 0,
    };

    const attributes = [
        {
            label: 'Trust',
            value: data.trust || 0,
            icon: Shield,
            description: 'Reflects how much the character relies on and believes in you.',
            type: 'positive'
        },
        {
            label: 'Affection',
            value: data.affection || 0,
            icon: Heart,
            description: 'Measures the emotional warmth and bond between you.',
            type: 'positive'
        },
        {
            label: 'Tension',
            value: data.tension || 0,
            icon: Zap,
            description: 'Higher tension indicates stress or conflict. Lower is generally better for stable relations.',
            type: 'negative'
        },
        {
            label: 'Respect',
            value: data.respect || 0,
            icon: Star,
            description: 'Shows how much the character values your opinions and actions.',
            type: 'positive'
        }
    ];

    const getProgressColor = (value: number, type: string) => {
        if (type === 'positive') {
            if (value < 33) return 'bg-slate-500';
            if (value < 66) return 'bg-amber-400';
            return 'bg-orange-500';
        } else {
            // Tension: Low is warm (good/calm), High is cold (stressful)
            if (value < 33) return 'bg-orange-500';
            if (value < 66) return 'bg-amber-400';
            return 'bg-slate-500';
        }
    };

    return (
        <TooltipProvider>
            <div className="p-4 space-y-5 bg-muted/20 rounded-xl border border-border/50 transition-all duration-300">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    Relationship State
                </h3>
                <div className="grid gap-4">
                    {attributes.map((attr) => {
                        const Icon = attr.icon;
                        return (
                            <div key={attr.label} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 cursor-help group">
                                                <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{attr.label}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p className="max-w-[200px]">{attr.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <span className="text-foreground/80">{attr.value}%</span>
                                </div>
                                <div className="relative h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-500", getProgressColor(attr.value, attr.type))}
                                        style={{ width: `${attr.value}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}
