 import { Shield, Heart, Zap, Star } from 'lucide-react';
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from '@/components/ui/tooltip';
 import { useRelationshipState } from '@/hooks/useRelationshipState';
 import { cn } from '@/lib/utils';
 
 interface RelationshipBarProps {
   characterId: string;
   personaId?: string;
 }
 
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
 
 export function RelationshipBar({ characterId, personaId }: RelationshipBarProps) {
   const { relationshipState, isLoading } = useRelationshipState(characterId, personaId);
 
   if (isLoading || !relationshipState) return null;
 
   const metrics = [
     { label: 'Trust', value: relationshipState.trust, icon: Shield, description: 'Confidence in your reliability and intentions', invert: false },
     { label: 'Affection', value: relationshipState.affection, icon: Heart, description: 'Warmth, fondness, and emotional attraction', invert: false },
     { label: 'Tension', value: relationshipState.tension, icon: Zap, description: 'Conflict, stress, or excitement levels', invert: true },
     { label: 'Respect', value: relationshipState.respect, icon: Star, description: 'Admiration for your character and choices', invert: false },
   ];
 
   return (
     <TooltipProvider>
       <div className="flex items-center justify-center gap-4 px-4 py-2 bg-background/40 backdrop-blur-sm border-b border-border/20">
         {metrics.map((metric) => (
           <Tooltip key={metric.label}>
             <TooltipTrigger asChild>
               <div className="flex items-center gap-1.5 cursor-help">
                 <metric.icon className="h-3 w-3 text-muted-foreground" />
                 <div className="w-10 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                   <div
                     className={cn(
                       'h-full rounded-full transition-all duration-500',
                       getBarColor(metric.value, metric.invert)
                     )}
                     style={{ width: `${metric.value}%` }}
                   />
                 </div>
                 <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">
                   {metric.value}
                 </span>
               </div>
             </TooltipTrigger>
             <TooltipContent className="bg-background/95 backdrop-blur-md border border-border/50">
               <p className="text-xs font-medium">{metric.label}: {metric.value}%</p>
               <p className="text-[10px] text-muted-foreground max-w-[160px]">{metric.description}</p>
             </TooltipContent>
           </Tooltip>
         ))}
       </div>
     </TooltipProvider>
   );
 }