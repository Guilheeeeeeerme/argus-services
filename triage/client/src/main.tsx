import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@argus/ui';
import '@argus/ui/tokens.css';
import '@argus/ui/global.css';
import './style.css';
import { API, Session, redirectToLogin } from './api';
import { TriageWorkspace } from './pages/TriageWorkspace';

function Root() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch(`${API}/v1/auth/session`, { credentials: 'include' })
      .then(response => {
        if (!response.ok) throw Error('unauthorized');
        return response.json();
      })
      .then(next => {
        if (!next.tenant_id) redirectToLogin();
        else setSession(next);
      })
      .catch(redirectToLogin);
  }, []);

  return session ? (
    <TriageWorkspace session={session} />
  ) : (
    <main><p>Checking session…</p></main>
  );
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <Root />
  </ThemeProvider>
);
