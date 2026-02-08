import { useRelationshipState } from '@/hooks/useRelationshipState';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Heart, Shield, Zap, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelationshipDashboardProps {
    characterId: string;
    personaId?: string;
}

export function RelationshipDashboard({ characterId, personaId }: RelationshipDashboardProps) {
    console.log('RelationshipDashboard rendering', { characterId, personaId });
    return (
        <div className="p-4 mb-4 bg-primary/10 border border-primary/20 rounded-xl">
            <h3 className="text-lg font-black uppercase tracking-widest text-red-500 mb-2">
                DASHBOARD LOADED
            </h3>
            <p className="text-[10px] text-muted-foreground">
                Character: {characterId} | Persona: {personaId || 'Standard'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="h-2 bg-primary/20 rounded-full" />
                <div className="h-2 bg-primary/20 rounded-full" />
            </div>
        </div>
    );
}
