import { useState } from 'react';
import { BookmarkPlus, Bookmark, Trash2, Edit2, Save, X, Clock, StickyNote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  useLessonNotes, 
  useCreateNote, 
  useUpdateNote, 
  useDeleteNote,
  LessonNote 
} from '@/hooks/useLessonNotes';
import { useToast } from '@/hooks/use-toast';

interface LessonNotesPanelProps {
  lessonId: string;
  currentVideoTime?: number;
  onSeekToTime?: (seconds: number) => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const LessonNotesPanel = ({
  lessonId,
  currentVideoTime = 0,
  onSeekToTime,
}: LessonNotesPanelProps) => {
  const { toast } = useToast();
  const { data: notes = [], isLoading } = useLessonNotes(lessonId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [newNote, setNewNote] = useState('');
  const [isBookmarkNote, setIsBookmarkNote] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateNote = async () => {
    if (!newNote.trim()) return;

    try {
      await createNote.mutateAsync({
        lessonId,
        content: newNote.trim(),
        isBookmark: isBookmarkNote,
        timestampSeconds: currentVideoTime > 0 ? Math.floor(currentVideoTime) : null,
      });
      setNewNote('');
      setIsBookmarkNote(false);
      setShowAddForm(false);
      toast({
        title: isBookmarkNote ? '¡Marcador guardado!' : '¡Nota guardada!',
        description: 'Tu apunte ha sido guardado exitosamente.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la nota.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateNote = async (note: LessonNote) => {
    if (!editContent.trim()) return;

    try {
      await updateNote.mutateAsync({
        noteId: note.id,
        content: editContent.trim(),
      });
      setEditingId(null);
      setEditContent('');
      toast({ title: 'Nota actualizada' });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la nota.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBookmark = async (note: LessonNote) => {
    try {
      await updateNote.mutateAsync({
        noteId: note.id,
        isBookmark: !note.is_bookmark,
      });
      toast({
        title: note.is_bookmark ? 'Marcador removido' : 'Marcador agregado',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el marcador.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (note: LessonNote) => {
    try {
      await deleteNote.mutateAsync({ noteId: note.id, lessonId });
      toast({ title: 'Nota eliminada' });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la nota.',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (note: LessonNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const bookmarks = notes.filter(n => n.is_bookmark);
  const regularNotes = notes.filter(n => !n.is_bookmark);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Mis Notas</h3>
          </div>
          <Button
            size="sm"
            variant={showAddForm ? "secondary" : "default"}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancelar' : 'Nueva Nota'}
          </Button>
        </div>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <div className="p-4 border-b border-border bg-muted/30">
          <Textarea
            placeholder="Escribe tu nota aquí..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="mb-3 min-h-[80px]"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isBookmarkNote ? "default" : "outline"}
                onClick={() => setIsBookmarkNote(!isBookmarkNote)}
              >
                {isBookmarkNote ? (
                  <Bookmark className="w-4 h-4 fill-current" />
                ) : (
                  <BookmarkPlus className="w-4 h-4" />
                )}
                Marcar
              </Button>
              {currentVideoTime > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(currentVideoTime)}
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleCreateNote}
              disabled={!newNote.trim() || createNote.isPending}
            >
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="h-[300px]">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Cargando notas...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center">
            <StickyNote className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              No tienes notas en esta lección.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Crea tu primera nota para guardar apuntes importantes.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-3">
            {/* Bookmarks Section */}
            {bookmarks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 mb-2">
                  <Bookmark className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    Marcadores ({bookmarks.length})
                  </span>
                </div>
                {bookmarks.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isEditing={editingId === note.id}
                    editContent={editContent}
                    onEditContentChange={setEditContent}
                    onStartEdit={() => startEditing(note)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={() => handleUpdateNote(note)}
                    onToggleBookmark={() => handleToggleBookmark(note)}
                    onDelete={() => handleDeleteNote(note)}
                    onSeekToTime={onSeekToTime}
                  />
                ))}
              </div>
            )}

            {/* Regular Notes Section */}
            {regularNotes.length > 0 && (
              <div>
                {bookmarks.length > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1 mb-2 mt-4">
                    <StickyNote className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Notas ({regularNotes.length})
                    </span>
                  </div>
                )}
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isEditing={editingId === note.id}
                    editContent={editContent}
                    onEditContentChange={setEditContent}
                    onStartEdit={() => startEditing(note)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={() => handleUpdateNote(note)}
                    onToggleBookmark={() => handleToggleBookmark(note)}
                    onDelete={() => handleDeleteNote(note)}
                    onSeekToTime={onSeekToTime}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

interface NoteCardProps {
  note: LessonNote;
  isEditing: boolean;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onToggleBookmark: () => void;
  onDelete: () => void;
  onSeekToTime?: (seconds: number) => void;
}

const NoteCard = ({
  note,
  isEditing,
  editContent,
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onToggleBookmark,
  onDelete,
  onSeekToTime,
}: NoteCardProps) => {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-colors mb-2",
        note.is_bookmark 
          ? "bg-primary/5 border-primary/20" 
          : "bg-muted/30 border-border"
      )}
    >
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            className="min-h-[60px]"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={onSave}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-foreground whitespace-pre-wrap mb-2">
            {note.content}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {note.timestamp_seconds !== null && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-primary hover:text-primary"
                  onClick={() => onSeekToTime?.(note.timestamp_seconds!)}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(note.timestamp_seconds)}
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(note.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={onToggleBookmark}
              >
                <Bookmark
                  className={cn(
                    "w-4 h-4",
                    note.is_bookmark && "fill-primary text-primary"
                  )}
                />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={onStartEdit}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
