import { useState } from 'react'

const STATUS_CFG = {
  active: { color: '#a8ff3e', bg: 'rgba(168,255,62,0.08)', label: 'ACTIVE', glow: 'lime-dot' },
  auditing: { color: '#f5c518', bg: 'rgba(245,197,24,0.08)', label: 'PROBATION', glow: 'amber-dot' },
  decommissioned: { color: '#ff3d3d', bg: 'rgba(255,61,61,0.08)', label: 'TERMINATED', glow: 'danger-dot' },
}

export default function Workforce({ agents, onSelectAgent, onNavigate, onRefresh }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = agents.filter(a => {
    const matchesFilter = filter === 'all' || a.status === filter
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.model.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>WORKFORCE</div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Silicon HR Roster</h1>
          <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>{agents.length} agent{agents.length !== 1 ? 's' : ''} in your fleet</p>
        </div>
        <button onClick={() => onNavigate('hire')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all hover:opacity-90" style={{ background: '#a8ff3e', color: '#060610' }}>
          + HIRE AGENT
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1a1a30' }}>
          {['all', 'active', 'auditing', 'decommissioned'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs font-mono tracking-wider transition-colors"
              style={{
                background: filter === f ? '#1a1a30' : 'transparent',
                color: filter === f ? '#f0f0ff' : '#3a3a5c',
              }}
            >{f === 'all' ? 'ALL' : STATUS_CFG[f]?.label}</button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search agents..."
          className="flex-1 max-w-xs px-3 py-1.5 rounded-lg text-xs"
          style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#d0d0e8' }}
        />
        <span className="text-xs font-mono ml-auto" style={{ color: '#3a3a5c' }}>{filtered.length} RESULTS</span>
      </div>

      {/* Agent cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="font-mono text-4xl mb-4" style={{ color: '#1a1a30' }}>∅</div>
          <p className="text-sm" style={{ color: '#3a3a5c' }}>No agents match your filters.</p>
          <button onClick={() => onNavigate('hire')} className="mt-4 text-xs font-mono" style={{ color: '#a8ff3e' }}>+ HIRE YOUR FIRST AGENT</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(agent => (
            <AgentCard key={agent.id} agent={agent} onClick={() => onSelectAgent(agent.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function AgentCard({ agent, onClick }) {
  const s = STATUS_CFG[agent.status] || STATUS_CFG.active
  const gen = agent.generation > 1 ? `GEN ${agent.generation}` : 'GEN 1'

  return (
    <button onClick={onClick} className="rounded-xl p-4 text-left w-full transition-all hover:translate-y-[-1px]" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${s.glow}`} style={{ background: s.color }} />
          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color, fontSize: '10px', letterSpacing: '0.08em' }}>{s.label}</span>
        </div>
        <span className="text-xs font-mono" style={{ color: '#1a1a30', letterSpacing: '0.1em' }}>{gen}</span>
      </div>

      {/* Name */}
      <h3 className="font-semibold text-base mb-1 truncate" style={{ color: '#f0f0ff' }}>{agent.name}</h3>
      <p className="text-xs font-mono mb-3 truncate" style={{ color: '#3a3a5c' }}>{agent.model}</p>

      {/* Instructions preview */}
      {agent.instructions && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: '#5a5a7a', lineHeight: 1.5 }}>{agent.instructions}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: '#1a1a30' }}>
        <div>
          <div className="text-xs font-mono" style={{ color: '#3a3a5c', letterSpacing: '0.08em' }}>SCORE</div>
          <div className="text-sm font-mono font-bold" style={{ color: agent.performance_score != null ? '#f0f0ff' : '#1a1a30' }}>
            {agent.performance_score != null ? agent.performance_score.toFixed(1) : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs font-mono" style={{ color: '#3a3a5c', letterSpacing: '0.08em' }}>TOKENS</div>
          <div className="text-sm font-mono font-bold" style={{ color: '#f0f0ff' }}>{(agent.token_spend || 0).toLocaleString()}</div>
        </div>
        {agent.parent_id && (
          <div className="ml-auto">
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,158,255,0.1)', color: '#4a9eff', fontSize: '10px' }}>EVOLVED</span>
          </div>
        )}
      </div>
    </button>
  )
}
