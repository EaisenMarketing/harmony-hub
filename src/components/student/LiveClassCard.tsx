 import { format } from 'date-fns';
 import { Video, Clock, Users, AlertCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { cn } from '@/lib/utils';
 import { UpcomingClass } from '@/hooks/useStudentData';
 
 const instrumentLabels: Record<string, string> = {
   guitar: 'Guitarra',
   piano: 'Piano',
 };
 
 interface LiveClassCardProps {
   liveClass: UpcomingClass;
   isRegistered: boolean;
   onRegister: () => void;
   isRegistering: boolean;
 }
 
 export const LiveClassCard = ({ 
   liveClass, 
   isRegistered, 
   onRegister, 
   isRegistering 
 }: LiveClassCardProps) => {
   const isFull = liveClass.max_attendees 
     ? liveClass.registeredCount >= liveClass.max_attendees 
     : false;
   const spotsLeft = liveClass.max_attendees 
     ? liveClass.max_attendees - liveClass.registeredCount 
     : null;
   const capacityPercent = liveClass.max_attendees 
     ? (liveClass.registeredCount / liveClass.max_attendees) * 100 
     : 0;
 
   return (
     <div className="p-4 border rounded-lg space-y-3">
       <div className="flex items-start justify-between gap-2">
         <h4 className="font-medium text-foreground">{liveClass.title}</h4>
         {isRegistered ? (
           <Badge variant="secondary" className="shrink-0">Inscrito</Badge>
         ) : isFull ? (
           <Badge variant="destructive" className="shrink-0">Lleno</Badge>
         ) : null}
       </div>
       
       {liveClass.description && (
         <p className="text-sm text-muted-foreground line-clamp-2">
           {liveClass.description}
         </p>
       )}
       
       <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
         <span className="flex items-center gap-1">
           <Clock className="w-3 h-3" />
           {format(new Date(liveClass.scheduled_at), 'HH:mm')}
         </span>
         {liveClass.duration_minutes && (
           <span>• {liveClass.duration_minutes} min</span>
         )}
         {liveClass.instrument && (
           <Badge variant="outline" className="text-xs">
             {instrumentLabels[liveClass.instrument] || liveClass.instrument}
           </Badge>
         )}
       </div>
       
       {/* Capacity indicator */}
       {liveClass.max_attendees && (
         <div className="space-y-1">
           <div className="flex items-center justify-between text-xs">
             <span className="flex items-center gap-1 text-muted-foreground">
               <Users className="w-3 h-3" />
               {liveClass.registeredCount} / {liveClass.max_attendees} inscritos
             </span>
             {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
               <span className="text-amber-600 flex items-center gap-1">
                 <AlertCircle className="w-3 h-3" />
                 ¡Solo {spotsLeft} lugar{spotsLeft > 1 ? 'es' : ''}!
               </span>
             )}
           </div>
           <Progress 
             value={capacityPercent} 
             className={cn(
               "h-1.5",
               capacityPercent >= 100 && "[&>div]:bg-destructive",
               capacityPercent >= 80 && capacityPercent < 100 && "[&>div]:bg-amber-500"
             )}
           />
         </div>
       )}
       
       {isRegistered ? (
         liveClass.zoom_join_url && (
           <Button size="sm" className="w-full" asChild>
             <a href={liveClass.zoom_join_url} target="_blank" rel="noopener noreferrer">
               <Video className="w-4 h-4 mr-2" />
               Unirse a la Clase
             </a>
           </Button>
         )
       ) : (
         <Button
           size="sm"
           className="w-full"
           onClick={onRegister}
           disabled={isRegistering || isFull}
           variant={isFull ? "secondary" : "default"}
         >
           {isFull ? 'Clase Llena' : 'Inscribirme'}
         </Button>
       )}
     </div>
   );
 };