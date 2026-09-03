import { useEffect, useState } from 'react';
import { Button, Card, Header, Badge, Message, ThemeToggle } from '@argus/ui';
import { API, WS, Session, redirectToLogin } from '../api';
import { DecisionDetail } from './DecisionDetail';

interface Decision {
  id: string;
  state: string;
  evidence_count: number;
  cumulative_severity: number;
}

interface TriageWorkspaceProps {
  session: Session;
}

export function TriageWorkspace({ session }: TriageWorkspaceProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selected, setSelected] = useState<Decision | null>(null);
  const [message, setMessage] = useState('');
  const tenant = session.tenant_id;

  useEffect(() => {
    if (!tenant) return;

    async function loadDecisions() {
      const response = await fetch(`${API}/v1/tenants/${tenant}/decisions`, { credentials: 'include' });
      if (response.status === 401) { redirectToLogin(); return; }
      setDecisions(await response.json());
      setMessage('Live triage connected.');
    }

    void loadDecisions();

    const ws = new WebSocket(`${WS}/v1/ws`);
    ws.onmessage = () => {
      fetch(`${API}/v1/tenants/${tenant}/decisions`, { credentials: 'include' })
        .then(x => x.json())
        .then(setDecisions);
    };
    ws.onerror = () => setMessage('WebSocket connection failed.');
    ws.onclose = () => setMessage('WebSocket disconnected; refresh to reconnect.');

    return () => ws.close();
  }, [tenant]);

  async function selectDecision(decision: Decision) {
    if (!tenant) return;
    setSelected(await fetch(`${API}/v1/tenants/${tenant}/decisions/${decision.id}`, {
      credentials: 'include',
    }).then(r => r.json()));
  }

  return (
    <main className="argus-triage">
      <Header
        title="ARGUS Triage"
        subtitle={`Real-time workspace · ${session.role}`}
        actions={<ThemeToggle />}
      />
      <Message text={message} />
      <div className="argus-triage__grid">
        <Card>
          <h2>Decision feed</h2>
          {decisions.map(decision => (
            <button
              key={decision.id}
              className="argus-decision-btn"
              onClick={() => selectDecision(decision)}
            >
              <Badge variant={decision.state as any}>{decision.state}</Badge>
              <span>{decision.evidence_count} evidence · severity {decision.cumulative_severity}</span>
            </button>
          ))}
        </Card>
        {selected && (
          <DecisionDetail
            decision={selected}
            tenant={tenant!}
            onResolved={() => { setSelected(null); setMessage('Decision resolved.'); }}
          />
        )}
      </div>
    </main>
  );
}
