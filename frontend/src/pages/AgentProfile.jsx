import { useState, useEffect, useCallback } from 'react'

const API = '/api'
const MODELS = ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-5-sonnet', 'gemini-1.5-flash']
const STATUS_CFG = {
  active: { color: '#a8ff3e', label: 'ACTIVE' },
  auditing: { color: '#f5c518', label: 'PROBATION' },
  decommissioned: { color: '#ff3d3d', label: 'TERMINATED' },
}

export default function AgentProfile({ agentId, agents, onUpdated, onDeleted, onNavigate }) {
  const [tab, setTab] = useState('overview')
  const [history, setHistory] = useState([])
  const [activity, setActivity] = useState([])
  const [editing, setEditing] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [form, setForm] = useState(null)

  const agent = agents.find(a => a.id === agentId)

  const fetchData = useCallback(async () => {
    if (!agentId) return
    try {
      const [h, a] = await Promise.all([
        fetch(`${API}/agents/${agentId}/history`).then(r => r.json()),
        fetch(`${API}/agents/${agentId}/activity`).then(r => r.json()),
      ])
      setHistory(h)
      setActivity(a)
    } catch (e) { console.error(e) }
  }, [agentId])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { if (agent) setForm({ name: agent.name, instructions: agent.instructions, model: agent.model || agent.llm, status: agent.status }) }, [agent])

  const handleSave = async () => {
    const res = await fetch(`${API}/agents/${agentId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const updated = await res.json()
    onUpdated(updated)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Decommission ${agent?.name} permanently?`)) return
    await fetch(`${API}/agents/${agentId}`, { method: 'DELETE' })
    onDeleted(agentId)
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    setChatLoading(true)
    try {
      const res = await fetch(`${API}/agents/${agentId}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: chatInput }),
      })
      const entry = await res.json()
      setHistory(prev => [...prev, entry])
      setActivity(prev => [...(entry.activity || []), ...prev])
      setChatInput('')
    } catch (e) { console.error(e) } finally { setChatLoading(false) }
  }

  if (!agent) return (
    <div className="flex items-center justify-center h-full" style={{ background: '#060610' }}>
      <div className="text-center">
        <p className="font-mono text-sm" style={{ color: '#3a3a5c' }}>No agent selected.</p>
        <button onClick={() => onNavigate('workforce')} className="mt-3 text-xs font-mono" style={{ color: '#a8ff3e' }}>← BACK TO WORKFORCE</button>
      </div>
    </div>
  )

  const s = STATUS_CFG[agent.status] || STATUS_CFG.active
  const TABS = ['overview', 'performance', 'dna', 'knowledge', 'activity']

  return (
    <div className="flex flex-col h-full" style={{ background: '#060610' }}>
      {/* Agent header */}
      <div className="px-6 pt-6 pb-4 border-b shrink-0" style={{ borderColor: '#1a1a30', background: '#0b0b1a' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0" style={{ background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.2)', color: '#a8ff3e' }}>
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full lime-dot" style={{ background: s.color }} />
              <span className="text-xs font-mono" style={{ color: s.color, letterSpacing: '0.1em' }}>{s.label}</span>
              {agent.generation > 1 && <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,158,255,0.1)', color: '#4a9eff' }}>GEN {agent.generation}</span>}
            </div>
            <h2 className="text-xl font-bold truncate" style={{ color: '#f0f0ff' }}>{agent.name}</h2>
            <p className="text-xs font-mono mt-0.5" style={{ color: '#3a3a5c' }}>{agent.model || agent.llm} · {agent.id}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors" style={{ border: '1px solid #1a1a30', color: '#d0d0e8' }}>EDIT</button>
            <button onClick={handleDelete} className="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors" style={{ border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>DECOM</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors"
              style={{
                background: tab === t ? 'rgba(168,255,62,0.1)' : 'transparent',
                color: tab === t ? '#a8ff3e' : '#3a3a5c',
                border: tab === t ? '1px solid rgba(168,255,62,0.2)' : '1px solid transparent',
              }}
            >{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && <OverviewTab agent={agent} history={history} />}
        {tab === 'performance' && <PerformanceTab agent={agent} history={history} />}
        {tab === 'dna' && <DnaTab agent={agent} />}
        {tab === 'knowledge' && <KnowledgeTab agent={agent} history={history} />}
        {tab === 'activity' && (
          <div className="flex flex-col h-full">
            <ActivityTab activity={activity} history={history} />
            {/* Chat input */}
            <form onSubmit={handleChat} className="px-6 py-3 border-t shrink-0 flex gap-2" style={{ borderColor: '#1a1a30', background: '#0b0b1a' }}>
              <span className="font-mono text-sm self-center" style={{ color: '#a8ff3e' }}>›</span>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={`Task ${agent.name}...`} disabled={chatLoading}
                className="flex-1 bg-transparent text-sm" style={{ color: '#d0d0e8', caretColor: '#a8ff3e' }} />
              <button type="submit" disabled={!chatInput.trim() || chatLoading}
                className="px-3 py-1 rounded text-xs font-mono font-bold transition-all"
                style={{ background: chatInput.trim() ? '#a8ff3e' : '#1a1a30', color: chatInput.trim() ? '#060610' : '#3a3a5c' }}>
                {chatLoading ? '...' : 'RUN'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(6,6,16,0.85)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#1a1a30' }}>
              <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>EDIT AGENT</span>
              <button onClick={() => setEditing(false)} style={{ color: '#3a3a5c' }}>✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Field label="NAME"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }} /></Field>
              <Field label="MODEL">
                <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="STATUS">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }}>
                  <option value="active">Active</option>
                  <option value="auditing">Auditing (Probation)</option>
                  <option value="decommissioned">Decommissioned</option>
                </select>
              </Field>
              <Field label="INSTRUCTIONS">
                <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={4} className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }} />
              </Field>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t" style={{ borderColor: '#1a1a30' }}>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-xs font-mono" style={{ border: '1px solid #1a1a30', color: '#5a5a7a' }}>CANCEL</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg text-xs font-mono font-bold" style={{ background: '#a8ff3e', color: '#060610' }}>SAVE CHANGES</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return <div><div className="font-mono text-xs mb-1.5" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>{label}</div>{children}</div>
}

function OverviewTab({ agent, history }) {
  const stats = [
    { label: 'TOTAL TASKS', value: history.length },
    { label: 'TOKEN SPEND', value: (agent.token_spend || 0).toLocaleString() },
    { label: 'GENERATION', value: `GEN ${agent.generation}` },
    { label: 'PERF SCORE', value: agent.performance_score != null ? agent.performance_score.toFixed(1) : '—' },
  ]
  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
            <div className="font-mono text-xs mb-2" style={{ color: '#3a3a5c', letterSpacing: '0.08em' }}>{s.label}</div>
            <div className="font-mono text-xl font-bold" style={{ color: '#f0f0ff' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <div className="font-mono text-xs mb-3" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>SYSTEM INSTRUCTIONS</div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#d0d0e8' }}>{agent.instructions || <span style={{ color: '#3a3a5c' }}>No instructions set.</span>}</p>
      </div>
      {agent.exit_summary && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,61,61,0.05)', border: '1px solid rgba(255,61,61,0.2)' }}>
          <div className="font-mono text-xs mb-2" style={{ color: '#ff3d3d', letterSpacing: '0.1em' }}>EXIT SUMMARY</div>
          <p className="text-sm" style={{ color: '#d0d0e8' }}>{agent.exit_summary}</p>
        </div>
      )}
    </div>
  )
}

function PerformanceTab({ agent, history }) {
  const score = agent.performance_score
  const pct = score != null ? Math.min(100, Math.max(0, score * 10)) : 0
  return (
    <div className="p-6 space-y-5">
      <div className="rounded-xl p-6" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <div className="font-mono text-xs mb-4" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>ROI SCORE</div>
        <div className="flex items-end gap-4 mb-4">
          <div className="font-mono text-5xl font-bold" style={{ color: score != null ? '#a8ff3e' : '#1a1a30' }}>
            {score != null ? score.toFixed(1) : '—'}
          </div>
          <div className="text-sm pb-2" style={{ color: '#5a5a7a' }}>/ 10.0</div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a30' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 70 ? '#a8ff3e' : pct > 40 ? '#f5c518' : '#ff3d3d' }} />
        </div>
      </div>
      <div className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <div className="font-mono text-xs mb-3" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>TASK HISTORY</div>
        {history.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#3a3a5c' }}>No tasks run yet.</p>
        ) : history.slice(-10).reverse().map((entry, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: '#1a1a30' }}>
            <div className="w-1 h-1 rounded-full" style={{ background: '#a8ff3e' }} />
            <p className="text-xs flex-1 truncate" style={{ color: '#5a5a7a' }}>{entry.user_message}</p>
            <span className="text-xs font-mono shrink-0" style={{ color: '#3a3a5c' }}>{new Date(entry.timestamp).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DnaTab({ agent }) {
  const traits = [
    { label: 'Model', value: agent.model || agent.llm },
    { label: 'Generation', value: `Gen ${agent.generation}` },
    { label: 'Parent', value: agent.parent_id || 'Origin — no parent' },
    { label: 'Status', value: agent.status },
    { label: 'Token spend', value: `${(agent.token_spend || 0).toLocaleString()} tokens` },
    { label: 'Created', value: new Date(agent.created_at).toLocaleDateString() },
  ]
  return (
    <div className="p-6 space-y-4">
      <div className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <div className="font-mono text-xs mb-4" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>AGENT DNA — WHAT I AM</div>
        <div className="space-y-3">
          {traits.map(t => (
            <div key={t.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#1a1a30' }}>
              <span className="text-xs font-mono" style={{ color: '#3a3a5c' }}>{t.label.toUpperCase()}</span>
              <span className="text-xs font-mono" style={{ color: '#d0d0e8' }}>{t.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <div className="font-mono text-xs mb-3" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>KNOWN LIMITATIONS</div>
        <p className="text-sm" style={{ color: '#5a5a7a' }}>
          {agent.exit_summary || 'No known failures logged yet. This agent is operating without documented issues.'}
        </p>
      </div>
    </div>
  )
}

function KnowledgeTab({ agent, history }) {
  const uniqueTopics = [...new Set(history.map(h => h.user_message.slice(0, 40)))]
  return (
    <div className="p-6 space-y-4">
      <div className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <div className="font-mono text-xs mb-4" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>KNOWLEDGE BRICKS CONTRIBUTED</div>
        <div className="font-mono text-3xl font-bold mb-2" style={{ color: '#a8ff3e' }}>{history.length}</div>
        <p className="text-xs" style={{ color: '#5a5a7a' }}>interactions recorded in the org vault</p>
      </div>
      {uniqueTopics.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
          <div className="font-mono text-xs mb-3" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>TOPIC AREAS</div>
          <div className="flex flex-wrap gap-2">
            {uniqueTopics.slice(0, 12).map((t, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded font-mono" style={{ background: '#0f0f22', border: '1px solid #1a1a30', color: '#5a5a7a' }}>{t}…</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityTab({ activity, history }) {
  const COLORS = { tool: '#4a9eff', success: '#a8ff3e', error: '#ff3d3d', message: '#3a3a5c' }
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {history.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm font-mono" style={{ color: '#3a3a5c' }}>No tasks yet. Use the command bar below to dispatch a job.</p>
        </div>
      ) : history.slice().reverse().map(entry => (
        <div key={entry.id} className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid #1a1a30' }}>
          <div className="px-4 py-3" style={{ background: '#0b0b1a' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono" style={{ color: '#a8ff3e' }}>USER</span>
              <span className="text-xs font-mono" style={{ color: '#3a3a5c' }}>{new Date(entry.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-sm" style={{ color: '#d0d0e8' }}>{entry.user_message}</p>
          </div>
          <div className="px-4 py-3 border-t" style={{ borderColor: '#1a1a30', background: '#060610' }}>
            <div className="text-xs font-mono mb-1" style={{ color: '#3a3a5c' }}>AGENT RESPONSE</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#d0d0e8' }}>{entry.agent_response}</p>
          </div>
          {entry.activity?.length > 0 && (
            <div className="px-4 py-2 border-t" style={{ borderColor: '#1a1a30', background: '#0b0b1a' }}>
              {entry.activity.map((a, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: COLORS[a.type] || '#3a3a5c' }} />
                  <span className="text-xs font-mono" style={{ color: COLORS[a.type] || '#3a3a5c' }}>{a.type?.toUpperCase()}</span>
                  <span className="text-xs" style={{ color: '#5a5a7a' }}>{a.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
