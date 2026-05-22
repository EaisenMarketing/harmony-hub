import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Heart, MessageCircle, ImagePlus, Trash2, Send, Loader2, Lock, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlan } from '@/hooks/useCourseViewer';
import { useIsAdmin } from '@/hooks/useAdminData';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CommunityPost, PostTag, useAddComment, useCommunityFeed, useCreatePost,
  useDeleteComment, useDeletePost, usePostComments, useToggleLike, uploadCommunityImage,
} from '@/hooks/useCommunity';

const tagLabels: Record<PostTag, string> = {
  general: 'General',
  progress: 'Avance',
  question: 'Pregunta',
  cover: 'Cover',
  tip: 'Tip',
};

const tagColors: Record<PostTag, string> = {
  general: 'bg-muted text-muted-foreground',
  progress: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  question: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  cover: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  tip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

const initials = (name?: string | null) =>
  (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const Composer = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<PostTag>('general');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const create = useCreatePost();

  const submit = async () => {
    if (content.trim().length < 2) return;
    try {
      setBusy(true);
      let image_url: string | null = null;
      if (file && user) image_url = await uploadCommunityImage(user.id, file);
      await create.mutateAsync({ content: content.trim(), tag, image_url });
      setContent(''); setFile(null); setTag('general');
      toast({ title: 'Publicado' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo publicar', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <Textarea
          placeholder="¿Qué progreso quieres compartir hoy?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={2000}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={tag} onValueChange={(v) => setTag(v as PostTag)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(tagLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm cursor-pointer">
            <ImagePlus className="w-4 h-4" />
            {file ? file.name.slice(0, 16) : 'Imagen'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <span className="text-xs text-muted-foreground ml-auto">{content.length}/2000</span>
          <Button onClick={submit} disabled={busy || content.trim().length < 2} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Comments = ({ postId }: { postId: string }) => {
  const { user } = useAuth();
  const { data: comments } = usePostComments(postId);
  const { data: isAdmin } = useIsAdmin();
  const add = useAddComment();
  const del = useDeleteComment();
  const [text, setText] = useState('');

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      {comments?.map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarImage src={c.author?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{initials(c.author?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-muted/50 rounded-lg p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{c.author?.full_name || 'Alumno'}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
          </div>
          {(c.user_id === user?.id || isAdmin) && (
            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => del.mutate({ id: c.id, postId })}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un comentario..."
          maxLength={500}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              add.mutate({ postId, content: text.trim() });
              setText('');
            }
          }}
        />
        <Button
          size="icon"
          disabled={!text.trim()}
          onClick={() => { add.mutate({ postId, content: text.trim() }); setText(''); }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const PostItem = ({ post }: { post: CommunityPost }) => {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const like = useToggleLike();
  const del = useDeletePost();
  const [showComments, setShowComments] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback>{initials(post.author?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{post.author?.full_name || 'Alumno'}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
            </p>
          </div>
          <Badge className={tagColors[post.tag]} variant="outline">{tagLabels[post.tag]}</Badge>
          {(post.user_id === user?.id || isAdmin) && (
            <Button size="icon" variant="ghost" onClick={() => del.mutate(post.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <img src={post.image_url} alt="" className="rounded-lg max-h-[500px] w-full object-cover" />
        )}
        <div className="flex items-center gap-4 pt-2">
          <Button
            variant="ghost" size="sm"
            className={`gap-2 ${post.liked_by_me ? 'text-red-500' : ''}`}
            onClick={() => like.mutate({ postId: post.id, liked: !!post.liked_by_me })}
          >
            <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
            {post.likes_count || 0}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowComments((s) => !s)}>
            <MessageCircle className="w-4 h-4" />
            {post.comments_count || 0}
          </Button>
        </div>
        {showComments && <Comments postId={post.id} />}
      </CardContent>
    </Card>
  );
};

const UpgradeLocked = () => (
  <Card className="border-primary/30">
    <CardContent className="pt-8 pb-8 text-center space-y-4">
      <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 items-center justify-center mx-auto">
        <Lock className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">Comunidad Pro</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Conecta con otros alumnos, comparte tus avances, sube covers y obtén feedback. Disponible para planes <strong>Pro</strong> y <strong>Producción</strong>.
      </p>
      <Link to="/portal/pagos">
        <Button size="lg" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Mejorar mi plan
        </Button>
      </Link>
    </CardContent>
  </Card>
);

export const CommunitySection = () => {
  const { data: plan } = useUserPlan();
  const { data: isAdmin } = useIsAdmin();
  const [filter, setFilter] = useState<PostTag | 'all'>('all');
  const hasAccess = plan === 'pro' || plan === 'production' || isAdmin;
  const { data: posts, isLoading } = useCommunityFeed(filter);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" />
          Comunidad
        </h1>
        <p className="text-muted-foreground mt-1">
          Comparte tu progreso, sube covers y aprende junto a otros alumnos Pro.
        </p>
      </header>

      {!hasAccess ? (
        <UpgradeLocked />
      ) : (
        <>
          <Composer />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-3">
                Feed
                <Select value={filter} onValueChange={(v) => setFilter(v as PostTag | 'all')}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(tagLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
          </Card>

          {isLoading && <p className="text-sm text-muted-foreground">Cargando feed...</p>}
          {!isLoading && !posts?.length && (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">
              Aún no hay publicaciones. ¡Sé el primero en publicar!
            </CardContent></Card>
          )}
          <div className="space-y-4">
            {posts?.map((p) => <PostItem key={p.id} post={p} />)}
          </div>
        </>
      )}
    </div>
  );
};
