import { useState } from 'react';
import { Button, Select, Textarea, Card, Badge, Message } from '@argus/ui';
import { API } from '../api';

interface Evidence {
  id: string;
  severity_score: number;
  captured_at: string;
  vlm_result?: { reasoning?: string; description?: string };
}

interface DecisionDetailProps {
  decision: any;
  tenant: string;
  onResolved: () => void;
}

export function DecisionDetail({ decision, tenant, onResolved }: DecisionDetailProps) {
  const [state, setState] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  async function resolve() {
    const response = await fetch(`${API}/v1/tenants/${tenant}/decisions/${decision.id}/resolve`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        disposition: state,
        reasoning: reason,
        updated_at: decision.updated_at,
      }),
    });
    if (response.ok) {
      onResolved();
    } else {
      setMessage(await response.text());
    }
  }

  return (
    <Card>
      <h2>Decision detail</h2>
      <p>
        <Badge variant={decision.state}>{decision.state}</Badge>
        {' · '}{decision.evidence_count} evidences
      </p>
      {decision.evidences?.map((evidence: Evidence) => (
        <article key={evidence.id} className="argus-evidence">
          <b>{evidence.severity_score}</b>
          <span>{new Date(evidence.captured_at).toLocaleString()}</span>
          <p>{evidence.vlm_result?.reasoning ?? evidence.vlm_result?.description}</p>
        </article>
      ))}
      <Select
        label="Disposition"
        value={state}
        onChange={e => setState(e.target.value)}
        options={[
          { value: '', label: 'Select...' },
          { value: 'true_positive', label: 'True Positive' },
          { value: 'false_positive', label: 'False Positive' },
          { value: 'false_negative', label: 'False Negative' },
        ]}
      />
      <Textarea
        label="Reasoning (required for false positive/negative)"
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <Button onClick={resolve}>Resolve</Button>
      <Message text={message} variant="error" />
    </Card>
  );
}
