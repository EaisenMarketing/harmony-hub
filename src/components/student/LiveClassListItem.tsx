 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { Users } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { UpcomingClass } from '@/hooks/useStudentData';
 
 interface LiveClassListItemProps {
   liveClass: UpcomingClass;
   isRegistered: boolean;
   onRegister: () => void;
   isRegistering: boolean;
 }
 
 export const LiveClassListItem = ({ 
   liveClass, 
   isRegistered, 
   onRegister, 
   isRegistering 
 }: LiveClassListItemProps) => {
   const isFull = liveClass.max_attendees 
     ? liveClass.registeredCount >= liveClass.max_attendees 
     : false;
   const spotsLeft = liveClass.max_attendees 
     ? liveClass.max_attendees - liveClass.registeredCount 
     : null;
 
   return (
     <div className="flex items-center gap-4 p-4 border rounded-lg">
       <div className="w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center text-primary shrink-0">
         <span className="text-lg font-bold">
           {format(new Date(liveClass.scheduled_at), 'd')}
         </span>
         <span className="text-xs uppercase">
           {format(new Date(liveClass.scheduled_at), 'MMM', { locale: es })}
         </span>
       </div>
       <div className="flex-1 min-w-0">
         <h4 className="font-medium text-foreground truncate">
           {liveClass.title}
         </h4>
         <p className="text-sm text-muted-foreground">
           {format(new Date(liveClass.scheduled_at), "HH:mm 'hrs'")}
           {liveClass.duration_minutes && ` • ${liveClass.duration_minutes} min`}
         </p>
         {liveClass.max_attendees && (
           <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
             <Users className="w-3 h-3" />
             {liveClass.registeredCount}/{liveClass.max_attendees}
             {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
               <span className="text-amber-600 ml-1">• ¡{spotsLeft} lugar{spotsLeft > 1 ? 'es' : ''}!</span>
             )}
             {isFull && <span className="text-destructive ml-1">• Lleno</span>}
           </p>
         )}
       </div>
       {isRegistered ? (
         <Badge variant="secondary">Inscrito</Badge>
       ) : isFull ? (
         <Badge variant="destructive">Lleno</Badge>
       ) : (
         <Button
           size="sm"
           variant="outline"
           onClick={onRegister}
           disabled={isRegistering}
         >
           Inscribirme
         </Button>
       )}
     </div>
   );
 };