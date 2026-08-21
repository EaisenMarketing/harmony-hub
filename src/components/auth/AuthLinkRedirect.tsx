import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CALLBACK_PATH = '/auth/callback';
const RECOVERY_PATH = '/reset-password';

/**
 * Recovers authentication links even when the provider sends them to the
 * homepage or to a legacy path. This runs before route content is rendered.
 */
const AuthLinkRedirect = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const search = new URLSearchParams(location.search);
  const type = hash.get('type') ?? search.get('type');
  const hasAuthPayload =
    hash.has('access_token') ||
    hash.has('error_description') ||
    search.has('code') ||
    search.has('token_hash') ||
    search.has('error_description');
  const destination = type === 'recovery' ? RECOVERY_PATH : CALLBACK_PATH;
  const shouldRedirect =
    hasAuthPayload &&
    location.pathname !== destination &&
    location.pathname !== CALLBACK_PATH &&
    location.pathname !== RECOVERY_PATH;

  useEffect(() => {
    if (!shouldRedirect) return;
    window.location.replace(`${destination}${location.search}${location.hash}`);
  }, [destination, location.hash, location.search, shouldRedirect]);

  if (shouldRedirect) {
    return <div className="min-h-screen bg-background" aria-label="Confirmando cuenta" />;
  }

  return <>{children}</>;
};

export default AuthLinkRedirect;