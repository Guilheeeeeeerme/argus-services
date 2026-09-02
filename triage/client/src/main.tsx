import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

declare global { interface Window { ARGUS_TRIAGE_CONFIG?: { apiUrl: string; websocketUrl: string }; } }
const runtimeConfig = window.ARGUS_TRIAGE_CONFIG;
const API = runtimeConfig?.apiUrl ?? import.meta.env.VITE_ADMIN_API ?? 'https://api.development.argus.com';
const WS = runtimeConfig?.websocketUrl ?? import.meta.env.VITE_WS_API ?? 'wss://development.argus.com:3002';
type Session = { tenant_id: string | null; role: string };

function redirectToLogin() { window.location.assign(`https://app.development.argus.com/?returnTo=${encodeURIComponent(window.location.href)}`); }
function App({ session }: { session: Session }) {
  const [decisions, setDecisions] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null); const [state, setState] = useState(''); const [reason, setReason] = useState(''); const [message, setMessage] = useState(''); const tenant = session.tenant_id;
  async function load() { if (!tenant) return; const response = await fetch(`${API}/v1/tenants/${tenant}/decisions`, { credentials: 'include' }); if (response.status === 401) { redirectToLogin(); return; } setDecisions(await response.json()); setMessage('Live triage connected.'); const ws = new WebSocket(`${WS}/v1/ws`); ws.onmessage = () => fetch(`${API}/v1/tenants/${tenant}/decisions`, { credentials: 'include' }).then(x => x.json()).then(setDecisions); ws.onclose = () => setMessage('WebSocket disconnected; refresh to reconnect.'); }
  useEffect(() => { void load(); }, [tenant]);
  async function detail(decision: any) { if (!tenant) return; setSelected(await fetch(`${API}/v1/tenants/${tenant}/decisions/${decision.id}`, { credentials: 'include' }).then(r => r.json())); }
  async function resolve() { if (!selected || !tenant) return; const response = await fetch(`${API}/v1/tenants/${tenant}/decisions/${selected.id}/resolve`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ disposition: state, reasoning: reason, updated_at: selected.updated_at }) }); setMessage(response.ok ? 'Decision resolved.' : await response.text()); }
  return <main><header><h1>ARGUS Triage</h1><p>Real-time workspace · {session.role}</p></header><p className="message">{message}</p><div className="grid"><section><h2>Decision feed</h2>{decisions.map(decision => <button className={`decision ${decision.state}`} key={decision.id} onClick={() => detail(decision)}><b>{decision.state}</b><span>{decision.evidence_count} evidence · severity {decision.cumulative_severity}</span></button>)}</section>{selected && <section><h2>Decision detail</h2><p><b className={selected.state}>{selected.state}</b> · {selected.evidence_count} evidences</p>{selected.evidences?.map((evidence: any) => <article key={evidence.id}><b>{evidence.severity_score}</b><span>{new Date(evidence.captured_at).toLocaleString()}</span><p>{evidence.vlm_result?.reasoning ?? evidence.vlm_result?.description}</p></article>)}<select value={state} onChange={e => setState(e.target.value)}><option value="">Disposition</option><option value="true_positive">True Positive</option><option value="false_positive">False Positive</option><option value="false_negative">False Negative</option></select><textarea placeholder="Reasoning (required for false positive/negative)" value={reason} onChange={e => setReason(e.target.value)} /><button onClick={resolve}>Resolve</button></section>}</div></main>;
}
function Root() { const [session, setSession] = useState<Session | null>(null); useEffect(() => { fetch(`${API}/v1/auth/session`, { credentials: 'include' }).then(response => { if (!response.ok) throw Error('unauthorized'); return response.json(); }).then(next => { if (!next.tenant_id) redirectToLogin(); else setSession(next); }).catch(redirectToLogin); }, []); return session ? <App session={session} /> : <main><p>Checking session…</p></main>; }
createRoot(document.getElementById('root')!).render(<Root />);
