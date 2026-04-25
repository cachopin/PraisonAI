import { useState, useMemo } from 'react'

const API = '/api'
const MODELS = ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-5-sonnet', 'gemini-1.5-flash']

const STATUS_CFG = {
  active: { color: '#a8ff3e', bg: 'rgba(168,255,62,0.08)', label: 'ACTIVE', glow: 'lime-dot' },
  auditing: { color: '#f5c518', bg: 'rgba(245,197,24,0.08)', label: 'PROBATION', glow: 'amber-dot' },
  decommissioned: { color: '#ff3d3d', bg: 'rgba(255,61,61,0.08)', label: 'TERMINATED', glow: 'danger-dot' },
}

function getDomain(agent) {
  const n = agent.name.toLowerCase(), ins = (agent.instructions || '').toLowerCase()
  if (n.includes('research') || ins.includes('research')) return 'Research & Intelligence'
  if (n.includes('code') || n.includes('engineer') || ins.includes('code')) return 'Engineering'
  if (n.includes('finance') || n.includes('account') || ins.includes('finance')) return 'Finance & Ops'
  if (n.includes('content') || n.includes('writer') || ins.includes('content')) return 'Content & Brand'
  if (n.includes('support') || n.includes('customer') || ins.includes('customer')) return 'Customer Success'
  if (n.includes('data') || n.includes('analyst') || ins.includes('data')) return 'Data & Analytics'
  if (n.includes('legal') || ins.includes('legal')) return 'Legal & Compliance'
  return agent.name.split(' ').slice(0, 2).join(' ') || 'General Ops'
}

function getRecommendation(agent) {
  const score = agent.performance_score
  if (score == null) return { text: 'Awaiting evaluation', color: '#3a3a5c' }
  if (score >= 8) return { text: 'Promote to senior role', color: '#a8ff3e' }
  if (score >= 6) return { text: 'Performing well', color: '#a8ff3e' }
  if (score >= 4) return { text: 'Monitor closely', color: '#f5c518' }
  return { text: 'Consider retraining', color: '#ff3d3d' }
}

export default function Workforce({ agents, onSelectAgent, onNavigate, onRefresh }) {
  const [selectedMgrId, setSelectedMgrId] = useState(null)
  const [showAddDirector, setShowAddDirector] = useState(false)
  const [showAddTask, setShowAddTask] = useState(null) // director id

  const directors = useMemo(() => agents.filter(a => !a.parent_id), [agents])
  const tasksByDirector = useMemo(() => {
    const map = {}
    directors.forEach(d => { map[d.id] = [] })
    agents.filter(a => a.parent_id).forEach(a => {
      if (!map[a.parent_id]) map[a.parent_id] = []
      map[a.parent_id].push(a)
    })
    return map
  }, [agents, directors])

  const activeCount = agents.filter(a => a.status === 'active').length
  const totalTokens = agents.reduce((s, a) => s + (a.token_spend || 0), 0)
  const avgScore = agents.length > 0
    ? (agents.reduce((s, a) => s + (a.performance_score || 0), 0) / agents.length).toFixed(1) : '—'

  const handleDeleteDirector = async (director) => {
    const taskCount = (tasksByDirector[director.id] || []).length
    const msg = taskCount > 0
      ? `Delete ${director.name} and their ${taskCount} task agent(s)? This cannot be undone.`
      : `Delete director ${director.name}? This cannot be undone.`
    if (!window.confirm(msg)) return
    await fetch(`${API}/agents/${director.id}`, { method: 'DELETE' })
    if (selectedMgrId === director.id) setSelectedMgrId(null)
    onRefresh()
  }

  const handleDeleteTask = async (agent) => {
    if (!window.confirm(`Delete task agent ${agent.name}?`)) return
    await fetch(`${API}/agents/${agent.id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#060610' }}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>WORKFORCE · ORG CHART</div>
            <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Silicon HR Roster</h1>
            <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>
              {directors.length} director{directors.length !== 1 ? 's' : ''} · {agents.filter(a => a.parent_id).length} task agents
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center">

          {/* ── TIER 1: Org summary ── */}
          <div className="w-full max-w-2xl">
            <OrgSummaryCard agentCount={agents.length} activeCount={activeCount} avgScore={avgScore} totalTokens={totalTokens} />
          </div>

          {/* Connector */}
          <div className="flex flex-col items-center" style={{ height: 40 }}>
            <div className="w-px flex-1" style={{ background: 'linear-gradient(to bottom, #1a1a30, #2a2a44)' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#2a2a44' }} />
          </div>

          {/* ── TIER 2: Directors ── */}
          <div className="w-full">
            {/* Rail header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: '#1a1a30' }} />
              <span className="font-mono text-xs px-3 py-1 rounded-full" style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#5a5a7a', letterSpacing: '0.1em' }}>
                DIRECTORS
              </span>
              <div className="h-px flex-1" style={{ background: '#1a1a30' }} />
            </div>

            {directors.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: '#0b0b1a', border: '1px dashed #1a1a30' }}>
                <p className="text-sm mb-3" style={{ color: '#3a3a5c' }}>No directors hired yet.</p>
                <button onClick={() => setShowAddDirector(true)} className="text-xs font-mono" style={{ color: '#a8ff3e' }}>+ ADD YOUR FIRST DIRECTOR</button>
              </div>
            ) : (
              <div className="flex gap-4 flex-wrap justify-center">
                {directors.map(agent => (
                  <DirectorCard
                    key={agent.id}
                    agent={agent}
                    selected={selectedMgrId === agent.id}
                    taskCount={(tasksByDirector[agent.id] || []).length}
                    onToggle={() => setSelectedMgrId(selectedMgrId === agent.id ? null : agent.id)}
                    onOpenProfile={() => onSelectAgent(agent.id)}
                    onDelete={() => handleDeleteDirector(agent)}
                  />
                ))}

                {/* Add director button */}
                <button
                  onClick={() => setShowAddDirector(true)}
                  className="rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-lime-dim"
                  style={{ width: 220, minHeight: 180, background: 'transparent', border: '1px dashed #1a1a30' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#3a3a5c', fontSize: 18 }}>+</div>
                  <span className="font-mono text-xs" style={{ color: '#3a3a5c' }}>ADD DIRECTOR</span>
                </button>
              </div>
            )}
          </div>

          {/* ── TIER 3: Task agents panel ── */}
          {selectedMgrId && (() => {
            const mgr = directors.find(d => d.id === selectedMgrId)
            const tasks = tasksByDirector[selectedMgrId] || []
            return mgr ? (
              <>
                <div className="flex flex-col items-center" style={{ height: 32 }}>
                  <div className="w-px flex-1" style={{ background: '#1a1a30' }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1a1a30' }} />
                </div>
                <div className="w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1" style={{ background: '#1a1a30' }} />
                    <span className="font-mono text-xs px-3 py-1 rounded-full" style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#5a5a7a', letterSpacing: '0.1em' }}>
                      {mgr.name.toUpperCase()} · TASK AGENTS
                    </span>
                    <div className="h-px flex-1" style={{ background: '#1a1a30' }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {tasks.map(task => (
                      <TaskCard key={task.id} agent={task} onSelect={() => onSelectAgent(task.id)} onDelete={() => handleDeleteTask(task)} />
                    ))}
                    <button
                      onClick={() => setShowAddTask(selectedMgrId)}
                      className="rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                      style={{ minHeight: 140, background: 'transparent', border: '1px dashed #1a1a30' }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#3a3a5c', fontSize: 16 }}>+</div>
                      <span className="font-mono text-xs" style={{ color: '#3a3a5c' }}>HIRE TASK AGENT</span>
                    </button>
                  </div>
                </div>
              </>
            ) : null
          })()}
        </div>
      </div>

      {/* Add Director Modal */}
      {showAddDirector && (
        <AddAgentModal
          title="ADD DIRECTOR"
          subtitle="Directors own a department, build strategy, and manage task agents."
          parentId={null}
          generation={1}
          onClose={() => setShowAddDirector(false)}
          onCreated={(agent) => { onRefresh(); setShowAddDirector(false) }}
        />
      )}

      {/* Add Task Agent Modal */}
      {showAddTask && (
        <AddAgentModal
          title="HIRE TASK AGENT"
          subtitle={`A focused agent under ${directors.find(d => d.id === showAddTask)?.name || 'this director'}.`}
          parentId={showAddTask}
          generation={2}
          onClose={() => setShowAddTask(null)}
          onCreated={(agent) => { onRefresh(); setShowAddTask(null) }}
        />
      )}
    </div>
  )
}

/* ── Org Summary ─────────────────────────────────────────────────── */
function OrgSummaryCard({ agentCount, activeCount, avgScore, totalTokens }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>CHIEF EXECUTIVE · YOUR COMPANY</div>
          <h2 className="text-lg font-bold" style={{ color: '#f0f0ff' }}>Owner</h2>
          <p className="text-xs mt-0.5" style={{ color: '#5a5a7a' }}>Full visibility and control over the silicon workforce</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0" style={{ background: 'rgba(168,255,62,0.1)', border: '1px solid rgba(168,255,62,0.2)', color: '#a8ff3e' }}>CEO</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'FLEET', value: agentCount, color: '#f0f0ff' },
          { label: 'ACTIVE', value: activeCount, color: '#a8ff3e' },
          { label: 'AVG SCORE', value: avgScore, color: '#4a9eff' },
          { label: 'TOKENS', value: totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens, color: '#f5c518' },
        ].map(s => (
          <div key={s.label}>
            <div className="font-mono mb-1" style={{ color: '#3a3a5c', fontSize: '10px', letterSpacing: '0.08em' }}>{s.label}</div>
            <div className="font-mono text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Director Card ───────────────────────────────────────────────── */
function DirectorCard({ agent, selected, taskCount, onToggle, onOpenProfile, onDelete }) {
  const s = STATUS_CFG[agent.status] || STATUS_CFG.active
  const domain = getDomain(agent)
  const rec = getRecommendation(agent)

  return (
    <div
      onClick={onToggle}
      className="rounded-xl cursor-pointer transition-all relative group"
      style={{
        background: selected ? 'rgba(168,255,62,0.04)' : '#0b0b1a',
        border: `1px solid ${selected ? 'rgba(168,255,62,0.3)' : '#1a1a30'}`,
        width: 220,
        boxShadow: selected ? '0 0 20px rgba(168,255,62,0.08)' : 'none',
      }}
    >
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{ background: 'rgba(255,61,61,0.1)', color: '#ff3d3d', fontSize: 12 }}
        title="Delete director"
      >×</button>

      <div className="h-0.5 rounded-t-xl" style={{ background: s.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-2 h-2 rounded-full mt-0.5 ${s.glow}`} style={{ background: s.color }} />
          <span className="font-mono text-xs" style={{ color: '#1a1a30', letterSpacing: '0.08em' }}>GEN {agent.generation}</span>
        </div>
        <h3 className="font-bold text-sm mb-0.5 truncate" style={{ color: '#f0f0ff' }}>{agent.name}</h3>
        <p className="text-xs font-mono mb-3 truncate" style={{ color: '#4a9eff' }}>{domain}</p>
        <div className="space-y-2 mb-3">
          <DataRow label="BUDGET" value={`${(agent.token_spend || 0).toLocaleString()} tk`} />
          <DataRow label="REPORTS" value={taskCount > 0 ? `${taskCount} agent${taskCount !== 1 ? 's' : ''}` : '—'} />
          <DataRow label="SCORE" value={agent.performance_score != null ? agent.performance_score.toFixed(1) : '—'} />
        </div>
        <div className="pt-2 border-t mb-2" style={{ borderColor: '#1a1a30' }}>
          <div className="font-mono mb-1" style={{ color: '#3a3a5c', fontSize: '10px', letterSpacing: '0.08em' }}>RECOMMENDATION</div>
          <p className="text-xs" style={{ color: rec.color }}>{rec.text}</p>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: '#1a1a30' }}>
          <button
            onClick={e => { e.stopPropagation(); onOpenProfile() }}
            className="text-xs font-mono transition-colors hover:opacity-70"
            style={{ color: '#5a5a7a' }}
          >PROFILE →</button>
          <div className="flex-1" />
          {taskCount > 0 && (
            <span className="text-xs font-mono" style={{ color: selected ? '#a8ff3e' : '#3a3a5c' }}>
              {selected ? '▲' : '▼'} TEAM
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Task Agent Card ─────────────────────────────────────────────── */
function TaskCard({ agent, onSelect, onDelete }) {
  const s = STATUS_CFG[agent.status] || STATUS_CFG.active
  return (
    <div className="rounded-xl p-4 relative group" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(255,61,61,0.1)', color: '#ff3d3d', fontSize: 12 }}
      >×</button>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${s.glow}`} style={{ background: s.color }} />
        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color, fontSize: '10px' }}>{s.label}</span>
      </div>
      <button onClick={onSelect} className="text-left w-full">
        <p className="font-semibold text-sm truncate mb-1" style={{ color: '#f0f0ff' }}>{agent.name}</p>
        <p className="text-xs font-mono mb-2 truncate" style={{ color: '#3a3a5c' }}>{agent.model}</p>
        {agent.instructions && <p className="text-xs line-clamp-2" style={{ color: '#5a5a7a', lineHeight: 1.5 }}>{agent.instructions}</p>}
        <div className="flex gap-3 mt-3 pt-2 border-t" style={{ borderColor: '#1a1a30' }}>
          <div>
            <div className="font-mono" style={{ color: '#3a3a5c', fontSize: '10px' }}>SCORE</div>
            <div className="font-mono text-sm font-bold" style={{ color: '#f0f0ff' }}>{agent.performance_score != null ? agent.performance_score.toFixed(1) : '—'}</div>
          </div>
          <div>
            <div className="font-mono" style={{ color: '#3a3a5c', fontSize: '10px' }}>TOKENS</div>
            <div className="font-mono text-sm font-bold" style={{ color: '#f0f0ff' }}>{(agent.token_spend || 0).toLocaleString()}</div>
          </div>
        </div>
      </button>
    </div>
  )
}

/* ── Add Agent Modal ─────────────────────────────────────────────── */
function AddAgentModal({ title, subtitle, parentId, generation, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', instructions: '', model: 'gpt-4o-mini' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parent_id: parentId, generation }),
      })
      if (!res.ok) throw new Error(await res.text())
      const agent = await res.json()
      onCreated(agent)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(6,6,16,0.88)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#1a1a30' }}>
          <div>
            <div className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>{title}</div>
            <p className="text-xs mt-0.5" style={{ color: '#5a5a7a' }}>{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-lg" style={{ color: '#3a3a5c' }}>✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <MField label="NAME">
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={parentId ? 'e.g. Outreach Specialist' : 'e.g. Head of Research'}
              className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8', caretColor: '#a8ff3e' }} />
          </MField>
          <MField label="MODEL">
            <select value={form.model} onChange={e => set('model', e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }}>
              {MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
          </MField>
          <MField label={parentId ? 'TASK INSTRUCTIONS (system prompt)' : 'DEPARTMENT INSTRUCTIONS'}>
            <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)}
              placeholder={parentId ? 'What specific task does this agent handle? What skills? What output format?' : 'What is this director responsible for? What is their mandate?'}
              rows={4} className="w-full px-3 py-2.5 rounded-lg text-sm resize-none" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8', caretColor: '#a8ff3e' }} />
          </MField>
          {error && <p className="text-xs font-mono" style={{ color: '#ff3d3d' }}>{error}</p>}
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t" style={{ borderColor: '#1a1a30' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-mono" style={{ border: '1px solid #1a1a30', color: '#5a5a7a' }}>CANCEL</button>
          <button onClick={handleCreate} disabled={loading} className="px-4 py-2 rounded-lg text-xs font-mono font-bold" style={{ background: '#a8ff3e', color: '#060610' }}>
            {loading ? 'CREATING...' : 'CREATE'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono" style={{ color: '#3a3a5c', fontSize: '10px', letterSpacing: '0.08em' }}>{label}</span>
      <span className="font-mono text-xs font-bold" style={{ color: '#f0f0ff' }}>{value}</span>
    </div>
  )
}

function MField({ label, children }) {
  return <div><div className="font-mono text-xs mb-1.5" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>{label}</div>{children}</div>
}
