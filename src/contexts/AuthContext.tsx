import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: (opts?: unknown) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Rutas privadas que requieren sesión activa
const PROTECTED_PREFIXES = ['/portal', '/admin', '/instructor', '/adflow'];

const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const expiryTimerRef = useRef<number | null>(null);
  const hadSessionRef = useRef(false);
  const manualSignOutRef = useRef(false);

  const clearExpiryTimer = () => {
    if (expiryTimerRef.current !== null) {
      window.clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  };

  // Programa un aviso justo cuando el token esté por expirar.
  const scheduleExpiryWarning = (s: Session | null) => {
    clearExpiryTimer();
    if (!s?.expires_at) return;
    const msUntilExpiry = s.expires_at * 1000 - Date.now();
    // Aviso 60s antes de expirar (mínimo 5s)
    const warnIn = Math.max(msUntilExpiry - 60_000, 5_000);
    if (warnIn > 0 && msUntilExpiry > 0) {
      expiryTimerRef.current = window.setTimeout(() => {
        toast.warning('Tu sesión está por expirar', {
          description: 'Estamos intentando renovarla automáticamente…',
        });
      }, warnIn);
    }
  };

  const handleSessionLoss = (reason: string) => {
    if (manualSignOutRef.current) return;
    if (isProtectedPath(location.pathname)) {
      toast.error('Tu sesión expiró', {
        description: reason,
      });
      navigate('/auth', { replace: true, state: { from: location.pathname } });
    }
  };

  useEffect(() => {
    // 1. Listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      switch (event) {
        case 'SIGNED_IN':
          hadSessionRef.current = true;
          manualSignOutRef.current = false;
          scheduleExpiryWarning(newSession);
          break;
        case 'TOKEN_REFRESHED':
          hadSessionRef.current = true;
          scheduleExpiryWarning(newSession);
          break;
        case 'SIGNED_OUT':
          clearExpiryTimer();
          if (hadSessionRef.current && !manualSignOutRef.current) {
            handleSessionLoss('Por favor inicia sesión de nuevo para continuar.');
          }
          hadSessionRef.current = false;
          manualSignOutRef.current = false;
          break;
        case 'USER_UPDATED':
          scheduleExpiryWarning(newSession);
          break;
      }
    });

    // 2. THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
      if (existing) {
        hadSessionRef.current = true;
        scheduleExpiryWarning(existing);
      }
    });

    // 3. Revalidar sesión al volver a la pestaña (token puede haber expirado)
    const revalidate = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        if (hadSessionRef.current) {
          setSession(null);
          setUser(null);
          handleSessionLoss('Detectamos que tu sesión ya no es válida. Vuelve a iniciar sesión.');
          hadSessionRef.current = false;
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && hadSessionRef.current) {
        revalidate();
      }
    };
    const onOnline = () => {
      if (hadSessionRef.current) revalidate();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      clearExpiryTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName || email.split('@')[0] },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async (opts?: { silent?: boolean; reason?: string }) => {
    manualSignOutRef.current = true;
    clearExpiryTimer();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    hadSessionRef.current = false;
    if (!opts?.silent) {
      toast.success(opts?.reason ?? 'Sesión cerrada correctamente');
    }
  };

  const value = { user, session, loading, signUp, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
