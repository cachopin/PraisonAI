import { useState, useEffect, useMemo } from 'react'

const API = '/api'

const ACTIVITY_COLORS = { tool: '#4a9eff', success: '#a8ff3e', error: '#ff3d3d', message: '#3a3a5c' }

function suggestAgent(text, agents) {
  if (!text.trim() || agents.length === 0) return null
  const lower = text.toLowerCase()
  const words = lower.split(/\s+/).filter(w => w.length > 3)
  for (const agent of agents) {
    const n = agent.name.toLowerCase()
    const ins = (agent.instructions || '').toLowerCase()
    if (words.some(w => n.includes(w) || ins.includes(w))) return agent
  }
  return null
}

export default function CommandCenter({ agents, onNavigate, onRefresh }) {
  const [command, setCommand] = useState('')
  const [targetId, setTargetId] = useState('auto')
  const [recentActivity, setRecentActivity] = useState([])
  const [dispatching, setDispatching] = useState(false)
  const [lastDispatch, setLastDispatch] = useState(null)
  const [orgKnowledge, setOrgKnowledge] = useState({})
  const [showOrgEdit, setShowOrgEdit] = useState(false)

  const activeAgents = agents.filter(a => a.status === 'active')
  const directors = agents.filter(a => !a.parent_id)
  const taskAgents = agents.filter(a => a.parent_id)
  const totalTokens = agents.reduce((s, a) => s + (a.token_spend || 0), 0)
  const avgScore = agents.length > 0
    ? (agents.reduce((s, a) => s + (a.performance_score || 0), 0) / agents.length).toFixed(1) : '—'

  const suggested = useMemo(() => {
    if (targetId !== 'auto' || !command.trim()) return null
    return suggestAgent(command, activeAgents)
  }, [command, targetId, activeAgents])

  const resolvedTarget = useMemo(() => {
    if (targetId === 'auto') return suggested || activeAgents[0] || null
    return agents.find(a => a.id === targetId) || null
  }, [targetId, agents, suggested, activeAgents])

  useEffect(() => {
    fetch(`${API}/kv/org_knowledge`).then(r => r.json()).then(d => {
      if (d && Object.keys(d).length > 0) setOrgKnowledge(d)
    }).catch(() => {})

    const fetchActivity = async () => {
      const entries = []
      for (const agent of agents.slice(0, 5)) {
        try {
          const data = await fetch(`${API}/agents/${agent.id}/activity`).then(r => r.json())
          entries.push(...data.slice(0, 3).map(a => ({ ...a, agentName: agent.name })))
        } catch (_) {}
      }
      entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setRecentActivity(entries.slice(0, 8))
    }
    if (agents.length > 0) fetchActivity()
  }, [agents])

  const handleDispatch = async (e) => {
    e.preventDefault()
    if (!command.trim() || !resolvedTarget) return
    setDispatching(true)
    try {
      const res = await fetch(`${API}/agents/${resolvedTarget.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command }),
      })
      const data = await res.json()
      setLastDispatch({ agent: resolvedTarget.name, response: data.agent_response, ts: new Date().toLocaleTimeString() })
      setCommand('')
      onRefresh()
    } catch (e) { console.error(e) }
    finally { setDispatching(false) }
  }

  const orgPreview = orgKnowledge.vision || orgKnowledge.short_term_priorities || ''

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>COMMAND CENTER</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#0f0f22', color: '#a8ff3e', border: '1px solid #1a1a30' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Committee Routing</h1>
        <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>
          {activeAgents.length} active · {directors.length} directors · {taskAgents.length} task agents
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'ACTIVE AGENTS', value: activeAgents.length, color: '#a8ff3e' },
          { label: 'AVG PERFORMANCE', value: avgScore, color: '#f0f0ff' },
          { label: 'TOKENS SPENT', value: totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens, color: '#4a9eff' },
          { label: 'TOTAL FLEET', value: agents.length, color: '#f5c518' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
            <div className="font-mono text-xs mb-2" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>{stat.label}</div>
            <div className="font-mono text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Org knowledge glimpse */}
      {orgPreview && (
        <div
          className="mb-5 rounded-xl p-3 cursor-pointer transition-all"
          style={{ background: 'rgba(168,255,62,0.03)', border: '1px solid rgba(168,255,62,0.12)' }}
          onClick={() => onNavigate('vault')}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a8ff3e' }} />
            <span className="font-mono text-xs" style={{ color: '#a8ff3e', letterSpacing: '0.08em' }}>ORG STRATEGY</span>
            <span className="font-mono text-xs ml-auto" style={{ color: '#3a3a5c' }}>EDIT →</span>
          </div>
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#5a5a7a' }}>{orgPreview}</p>
        </div>
      )}

      {/* ── Dispatch panel ── */}
      <div className="rounded-xl mb-5" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#1a1a30' }}>
          <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>ROUTE TO</span>

          {/* Target selector */}
          <select
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono"
            style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8', maxWidth: 280 }}
          >
            <option value="auto">Auto-route (smart suggest)</option>
            {directors.length > 0 && (
              <optgroup label="── Directors">
                {directors.map(a => (
                  <option key={a.id} value={a.id} disabled={a.status !== 'active'}>
                    {a.name}{a.status !== 'active' ? ' (inactive)' : ''}
                  </option>
                ))}
              </optgroup>
            )}
            {taskAgents.length > 0 && (
              <optgroup label="── Task Agents">
                {taskAgents.map(a => (
                  <option key={a.id} value={a.id} disabled={a.status !== 'active'}>
                    {a.name}{a.status !== 'active' ? ' (inactive)' : ''}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Resolved target indicator */}
          {resolvedTarget && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full lime-dot" style={{ background: '#a8ff3e' }} />
              <span className="text-xs font-mono" style={{ color: '#d0d0e8' }}>{resolvedTarget.name}</span>
              {targetId === 'auto' && suggested && (
                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(168,255,62,0.08)', color: '#a8ff3e', border: '1px solid rgba(168,255,62,0.15)', fontSize: '10px' }}>SUGGESTED</span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleDispatch} className="flex gap-2 p-3">
          <span className="font-mono text-sm font-bold self-center" style={{ color: '#a8ff3e' }}>›</span>
          <input
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder={resolvedTarget ? `Dispatch to ${resolvedTarget.name}...` : 'Hire an active agent first...'}
            disabled={!resolvedTarget || dispatching}
            className="flex-1 bg-transparent text-sm"
            style={{ color: '#d0d0e8', caretColor: '#a8ff3e' }}
          />
          <button
            type="submit"
            disabled={!command.trim() || !resolvedTarget || dispatching}
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0"
            style={{
              background: command.trim() && resolvedTarget && !dispatching ? '#a8ff3e' : '#1a1a30',
              color: command.trim() && resolvedTarget && !dispatching ? '#060610' : '#3a3a5c',
            }}
          >
            {dispatching ? 'RUNNING...' : 'DISPATCH'}
          </button>
        </form>

        {lastDispatch && (
          <div className="px-4 pb-3 border-t" style={{ borderColor: '#1a1a30' }}>
            <div className="text-xs mt-2 mb-1" style={{ color: '#5a5a7a' }}>
              <span style={{ color: '#a8ff3e' }}>{lastDispatch.agent}</span>
              <span className="mx-1">·</span>
              <span>{lastDispatch.ts}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#d0d0e8' }}>
              {lastDispatch.response.slice(0, 300)}{lastDispatch.response.length > 300 ? '…' : ''}
            </p>
          </div>
        )}
      </div>

      {/* ── Two column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active agents roster */}
        <div className="rounded-xl" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#1a1a30' }}>
            <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>WORKFORCE</span>
            <button onClick={() => onNavigate('workforce')} className="text-xs hover:opacity-70" style={{ color: '#a8ff3e' }}>VIEW ALL →</button>
          </div>
          <div className="divide-y" style={{ borderColor: '#1a1a30' }}>
            {agents.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm" style={{ color: '#3a3a5c' }}>No agents deployed.</p>
                <button onClick={() => onNavigate('hire')} className="text-xs mt-2 font-mono" style={{ color: '#a8ff3e' }}>+ HIRE YOUR FIRST AGENT</button>
              </div>
            ) : agents.slice(0, 6).map(agent => (
              <AgentRow key={agent.id} agent={agent} isTarget={resolvedTarget?.id === agent.id}
                onClick={() => onNavigate('profile', agent.id)} onTarget={() => setTargetId(agent.id)} />
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-xl" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#1a1a30' }}>
            <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>RECENT ACTIVITY</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#0f0f22' }}>
            {recentActivity.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: '#3a3a5c' }}>
                No activity yet. Dispatch a job to see logs here.
              </div>
            ) : recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ACTIVITY_COLORS[item.type] || '#3a3a5c' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-mono" style={{ color: '#a8ff3e' }}>{item.agentName}</span>
                    <span className="text-xs" style={{ color: '#3a3a5c' }}>·</span>
                    <span className="text-xs font-mono" style={{ color: '#3a3a5c' }}>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: '#5a5a7a' }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentRow({ agent, isTarget, onClick, onTarget }) {
  const STATUS = {
    active: { color: '#a8ff3e', label: 'ACTIVE' },
    auditing: { color: '#f5c518', label: 'AUDIT' },
    decommissioned: { color: '#ff3d3d', label: 'DECOM' },
  }
  const s = STATUS[agent.status] || STATUS.active

  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${isTarget ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}>
      {isTarget ? (
        <div className="w-2 h-2 rounded-full shrink-0 lime-dot" style={{ background: '#a8ff3e' }} />
      ) : (
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
      )}
      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate" style={{ color: '#d0d0e8' }}>{agent.name}</p>
        <p className="text-xs font-mono truncate" style={{ color: '#3a3a5c' }}>{agent.model}{agent.parent_id ? ' · task' : ' · director'}</p>
      </button>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-xs font-mono" style={{ color: s.color }}>{s.label}</div>
        <button
          onClick={() => onTarget()}
          className="text-xs font-mono px-1.5 py-0.5 rounded transition-all"
          style={{ background: isTarget ? 'rgba(168,255,62,0.12)' : '#0f0f22', color: isTarget ? '#a8ff3e' : '#3a3a5c', border: '1px solid #1a1a30' }}
        >
          {isTarget ? 'TARGETED' : 'TARGET'}
        </button>
      </div>
    </div>
  )
}
