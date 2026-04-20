import { useState, useEffect } from 'react'

const API = '/api'

export default function CommandCenter({ agents, onNavigate, onRefresh }) {
  const [command, setCommand] = useState('')
  const [recentActivity, setRecentActivity] = useState([])
  const [dispatching, setDispatching] = useState(false)
  const [lastDispatch, setLastDispatch] = useState(null)

  const activeAgents = agents.filter(a => a.status === 'active')
  const totalTokens = agents.reduce((s, a) => s + (a.token_spend || 0), 0)
  const avgScore = agents.length > 0
    ? (agents.reduce((s, a) => s + (a.performance_score || 0), 0) / agents.length).toFixed(1)
    : '—'

  useEffect(() => {
    const fetchActivity = async () => {
      const entries = []
      for (const agent of agents.slice(0, 3)) {
        try {
          const res = await fetch(`${API}/agents/${agent.id}/activity`)
          const data = await res.json()
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
    if (!command.trim() || activeAgents.length === 0) return
    const target = activeAgents[0]
    setDispatching(true)
    try {
      const res = await fetch(`${API}/agents/${target.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command }),
      })
      const data = await res.json()
      setLastDispatch({ agent: target.name, response: data.agent_response, ts: new Date().toLocaleTimeString() })
      setCommand('')
      onRefresh()
    } catch (e) { console.error(e) }
    finally { setDispatching(false) }
  }

  const ACTIVITY_COLORS = {
    tool: '#4a9eff', success: '#a8ff3e', error: '#ff3d3d', message: '#3a3a5c',
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>COMMAND CENTER</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#0f0f22', color: '#a8ff3e', border: '1px solid #1a1a30' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>
          Your company ran overnight.
        </h1>
        <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>
          {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} on duty — {totalTokens.toLocaleString()} tokens consumed
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'ACTIVE AGENTS', value: activeAgents.length, color: '#a8ff3e', suffix: '' },
          { label: 'AVG PERFORMANCE', value: avgScore, color: '#f0f0ff', suffix: '' },
          { label: 'TOKENS SPENT', value: totalTokens.toLocaleString(), color: '#4a9eff', suffix: '' },
          { label: 'TOTAL FLEET', value: agents.length, color: '#f5c518', suffix: '' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
            <div className="font-mono text-xs mb-2" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>{stat.label}</div>
            <div className="font-mono text-2xl font-bold" style={{ color: stat.color }}>{stat.value}{stat.suffix}</div>
          </div>
        ))}
      </div>

      {/* Command bar */}
      <div className="mb-6 rounded-xl p-1" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
        <form onSubmit={handleDispatch} className="flex gap-2 p-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-sm font-bold" style={{ color: '#a8ff3e' }}>›</span>
          </div>
          <input
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder={activeAgents.length > 0 ? `Dispatch a job to ${activeAgents[0]?.name}...` : 'Hire an agent first to dispatch jobs...'}
            disabled={activeAgents.length === 0 || dispatching}
            className="flex-1 bg-transparent text-sm"
            style={{ color: '#d0d0e8', caretColor: '#a8ff3e' }}
          />
          <button
            type="submit"
            disabled={!command.trim() || activeAgents.length === 0 || dispatching}
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all"
            style={{
              background: command.trim() && !dispatching ? '#a8ff3e' : '#1a1a30',
              color: command.trim() && !dispatching ? '#060610' : '#3a3a5c',
            }}
          >
            {dispatching ? 'RUNNING...' : 'DISPATCH'}
          </button>
        </form>
        {lastDispatch && (
          <div className="px-4 pb-3 pt-0 border-t" style={{ borderColor: '#1a1a30' }}>
            <div className="text-xs mt-2" style={{ color: '#5a5a7a' }}>
              <span style={{ color: '#a8ff3e' }}>{lastDispatch.agent}</span>
              <span className="mx-1">·</span>
              <span>{lastDispatch.ts}</span>
            </div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#d0d0e8' }}>
              {lastDispatch.response.slice(0, 200)}{lastDispatch.response.length > 200 ? '…' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Two columns: agents + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent roster snapshot */}
        <div className="rounded-xl" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#1a1a30' }}>
            <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>WORKFORCE</span>
            <button onClick={() => onNavigate('workforce')} className="text-xs transition-colors hover:opacity-80" style={{ color: '#a8ff3e' }}>VIEW ALL →</button>
          </div>
          <div className="divide-y" style={{ borderColor: '#1a1a30' }}>
            {agents.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm" style={{ color: '#3a3a5c' }}>No agents deployed.</p>
                <button onClick={() => onNavigate('hire')} className="text-xs mt-2 font-mono" style={{ color: '#a8ff3e' }}>+ HIRE YOUR FIRST AGENT</button>
              </div>
            ) : agents.slice(0, 5).map(agent => (
              <AgentRow key={agent.id} agent={agent} onClick={() => onNavigate('profile', agent.id)} />
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-xl" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#1a1a30' }}>
            <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>OVERNIGHT ACTIVITY</span>
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

function AgentRow({ agent, onClick }) {
  const STATUS = {
    active: { color: '#a8ff3e', glow: 'lime-dot', label: 'ACTIVE' },
    auditing: { color: '#f5c518', glow: 'amber-dot', label: 'AUDIT' },
    decommissioned: { color: '#ff3d3d', glow: 'danger-dot', label: 'DECOM' },
  }
  const s = STATUS[agent.status] || STATUS.active

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]">
      <div className={`w-2 h-2 rounded-full shrink-0 ${s.glow}`} style={{ background: s.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#d0d0e8' }}>{agent.name}</p>
        <p className="text-xs font-mono truncate" style={{ color: '#3a3a5c' }}>{agent.model}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-mono" style={{ color: s.color }}>{s.label}</div>
        {agent.performance_score != null && (
          <div className="text-xs font-mono" style={{ color: '#3a3a5c' }}>{agent.performance_score.toFixed(1)}</div>
        )}
      </div>
    </button>
  )
}
