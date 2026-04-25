import { useState, useMemo } from 'react'

const STATUS_CFG = {
  active: { color: '#a8ff3e', bg: 'rgba(168,255,62,0.08)', label: 'ACTIVE', glow: 'lime-dot' },
  auditing: { color: '#f5c518', bg: 'rgba(245,197,24,0.08)', label: 'PROBATION', glow: 'amber-dot' },
  decommissioned: { color: '#ff3d3d', bg: 'rgba(255,61,61,0.08)', label: 'TERMINATED', glow: 'danger-dot' },
}

function getDomain(agent) {
  const n = agent.name.toLowerCase()
  const ins = (agent.instructions || '').toLowerCase()
  if (n.includes('research') || ins.includes('research')) return 'Research & Intelligence'
  if (n.includes('code') || n.includes('engineer') || ins.includes('code')) return 'Engineering'
  if (n.includes('finance') || n.includes('account') || ins.includes('finance')) return 'Finance & Ops'
  if (n.includes('content') || n.includes('writer') || ins.includes('content')) return 'Content & Brand'
  if (n.includes('support') || n.includes('customer') || ins.includes('customer')) return 'Customer Success'
  if (n.includes('data') || n.includes('analyst') || ins.includes('data')) return 'Data & Analytics'
  if (n.includes('legal') || ins.includes('legal')) return 'Legal & Compliance'
  const words = agent.name.split(' ').slice(0, 2).join(' ')
  return words || 'General Ops'
}

function getRecommendation(agent) {
  const score = agent.performance_score
  if (score == null) return { text: 'Awaiting evaluation', color: '#3a3a5c' }
  if (score >= 8) return { text: 'Promote to senior role', color: '#a8ff3e' }
  if (score >= 6) return { text: 'Performing well', color: '#a8ff3e' }
  if (score >= 4) return { text: 'Monitor closely', color: '#f5c518' }
  return { text: 'Consider retraining', color: '#ff3d3d' }
}

export default function Workforce({ agents, onSelectAgent, onNavigate }) {
  const [selectedMgrId, setSelectedMgrId] = useState(null)

  // Build 3-tier hierarchy from parent_id relationships
  const { ceoAgents, managerAgents, tasksByManager } = useMemo(() => {
    const childrenMap = {}
    agents.forEach(a => {
      const pid = a.parent_id || '__root__'
      if (!childrenMap[pid]) childrenMap[pid] = []
      childrenMap[pid].push(a)
    })

    // Roots = no parent_id
    const roots = (childrenMap['__root__'] || []).slice().sort((a, b) => a.generation - b.generation)

    // If all agents are roots (no parent-child links exist), treat gen=1 as CEO-level summary,
    // and show all agents as managers
    const hasHierarchy = agents.some(a => a.parent_id)

    if (hasHierarchy) {
      // True hierarchy: roots are CEOs, their children are managers, grandchildren are tasks
      const ceo = roots
      const mgrs = []
      const tasks = {}
      ceo.forEach(c => {
        const children = childrenMap[c.id] || []
        children.forEach(mgr => {
          mgrs.push(mgr)
          tasks[mgr.id] = childrenMap[mgr.id] || []
        })
      })
      // Agents with no parent but not CEO level → also managers
      roots.forEach(r => {
        if (!mgrs.find(m => m.id === r.id) && !ceo.find(c => c.id === r.id)) {
          mgrs.push(r)
          tasks[r.id] = childrenMap[r.id] || []
        }
      })
      return { ceoAgents: ceo, managerAgents: mgrs, tasksByManager: tasks }
    } else {
      // Flat: show org-level CEO summary, all agents as managers
      const tasks = {}
      roots.forEach(r => { tasks[r.id] = [] })
      return { ceoAgents: [], managerAgents: roots, tasksByManager: tasks }
    }
  }, [agents])

  const selectedMgr = managerAgents.find(a => a.id === selectedMgrId)
  const selectedTasks = selectedMgrId ? (tasksByManager[selectedMgrId] || []) : []

  const activeCount = agents.filter(a => a.status === 'active').length
  const totalTokens = agents.reduce((s, a) => s + (a.token_spend || 0), 0)
  const avgScore = agents.length > 0
    ? (agents.reduce((s, a) => s + (a.performance_score || 0), 0) / agents.length).toFixed(1) : '—'

  const hasHierarchy = agents.some(a => a.parent_id)

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#060610' }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>WORKFORCE · ORG CHART</div>
            <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Silicon HR Roster</h1>
            <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>{agents.length} agent{agents.length !== 1 ? 's' : ''} across {hasHierarchy ? 'a hierarchy' : 'the fleet'}</p>
          </div>
          <button
            onClick={() => onNavigate('hire')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all hover:opacity-90"
            style={{ background: '#a8ff3e', color: '#060610' }}
          >
            + HIRE AGENT
          </button>
        </div>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="font-mono text-4xl mb-4" style={{ color: '#1a1a30' }}>∅</div>
            <p className="text-sm mb-1" style={{ color: '#3a3a5c' }}>Your company has no agents yet.</p>
            <button onClick={() => onNavigate('hire')} className="mt-4 text-xs font-mono" style={{ color: '#a8ff3e' }}>+ HIRE YOUR FIRST AGENT</button>
          </div>
        ) : (
          <div className="flex flex-col items-center">

            {/* ── TIER 1: CEO / Org summary ── */}
            <div className="w-full max-w-2xl mb-0">
              {ceoAgents.length > 0 ? (
                /* Actual root agents */
                <div className="flex gap-4 justify-center">
                  {ceoAgents.map(agent => (
                    <CeoCard key={agent.id} agent={agent} onSelect={() => onSelectAgent(agent.id)} />
                  ))}
                </div>
              ) : (
                /* Flat org — show company-level summary */
                <OrgSummaryCard
                  agentCount={agents.length}
                  activeCount={activeCount}
                  avgScore={avgScore}
                  totalTokens={totalTokens}
                />
              )}
            </div>

            {/* Connector line down */}
            {managerAgents.length > 0 && (
              <div className="flex flex-col items-center my-0" style={{ height: 40 }}>
                <div className="w-px flex-1" style={{ background: 'linear-gradient(to bottom, #1a1a30, #2a2a44)' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#2a2a44' }} />
              </div>
            )}

            {/* ── TIER 2: Managers ── */}
            {managerAgents.length > 0 && (
              <>
                {/* Horizontal rail */}
                <div className="relative w-full flex justify-center">
                  {/* The horizontal connecting line across managers */}
                  {managerAgents.length > 1 && (
                    <div className="absolute top-0 h-px" style={{
                      background: '#1a1a30',
                      left: `calc(50% - ${Math.min(managerAgents.length, 4) * 10}%)`,
                      right: `calc(50% - ${Math.min(managerAgents.length, 4) * 10}%)`,
                    }} />
                  )}

                  <div className="flex gap-4 flex-wrap justify-center pt-0">
                    {managerAgents.map(agent => (
                      <div key={agent.id} className="flex flex-col items-center">
                        {/* Connector stub up */}
                        <div className="w-px mb-0" style={{ height: 0, background: '#1a1a30' }} />
                        <ManagerCard
                          agent={agent}
                          selected={selectedMgrId === agent.id}
                          taskCount={tasksByManager[agent.id]?.length || 0}
                          onSelect={() => setSelectedMgrId(selectedMgrId === agent.id ? null : agent.id)}
                          onOpenProfile={() => onSelectAgent(agent.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── TIER 3: Task agents (expandable) ── */}
                {selectedMgr && (
                  <>
                    {/* Connector down from selected manager */}
                    <div className="flex flex-col items-center" style={{ height: 32 }}>
                      <div className="w-px flex-1" style={{ background: '#1a1a30' }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1a1a30' }} />
                    </div>

                    <div className="w-full max-w-4xl">
                      {/* Task panel header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1" style={{ background: '#1a1a30' }} />
                        <span className="font-mono text-xs px-3 py-1 rounded-full" style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#5a5a7a', letterSpacing: '0.1em' }}>
                          {selectedMgr.name.toUpperCase()} · DIRECT REPORTS
                        </span>
                        <div className="h-px flex-1" style={{ background: '#1a1a30' }} />
                      </div>

                      {selectedTasks.length === 0 ? (
                        <div className="rounded-xl p-6 text-center" style={{ background: '#0b0b1a', border: '1px dashed #1a1a30' }}>
                          <p className="text-sm mb-1" style={{ color: '#3a3a5c' }}>No task agents assigned to {selectedMgr.name} yet.</p>
                          <button
                            onClick={() => onNavigate('hire')}
                            className="text-xs font-mono mt-2"
                            style={{ color: '#a8ff3e' }}
                          >
                            + HIRE A REPORT FOR THIS MANAGER
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedTasks.map(task => (
                            <TaskAgentCard key={task.id} agent={task} onSelect={() => onSelectAgent(task.id)} />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── CEO / Org Summary Cards ──────────────────────────────────── */

function OrgSummaryCard({ agentCount, activeCount, avgScore, totalTokens }) {
  return (
    <div className="rounded-2xl p-5 w-full" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>CHIEF EXECUTIVE · YOUR COMPANY</div>
          <h2 className="text-lg font-bold" style={{ color: '#f0f0ff' }}>Owner</h2>
          <p className="text-xs mt-0.5" style={{ color: '#5a5a7a' }}>You have full visibility and control</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm" style={{ background: 'rgba(168,255,62,0.1)', border: '1px solid rgba(168,255,62,0.2)', color: '#a8ff3e' }}>CEO</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'FLEET SIZE', value: agentCount, color: '#f0f0ff' },
          { label: 'ON DUTY', value: activeCount, color: '#a8ff3e' },
          { label: 'AVG SCORE', value: avgScore, color: '#4a9eff' },
          { label: 'TOKENS SPENT', value: totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens, color: '#f5c518' },
        ].map(s => (
          <div key={s.label}>
            <div className="font-mono text-xs mb-1" style={{ color: '#3a3a5c', fontSize: '10px', letterSpacing: '0.08em' }}>{s.label}</div>
            <div className="font-mono text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CeoCard({ agent, onSelect }) {
  const s = STATUS_CFG[agent.status] || STATUS_CFG.active
  return (
    <div className="rounded-2xl p-5 min-w-64" style={{ background: '#0b0b1a', border: `1px solid ${s.color}33` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>CHIEF EXECUTIVE</span>
        <div className={`w-2 h-2 rounded-full ${s.glow}`} style={{ background: s.color }} />
      </div>
      <h3 className="text-lg font-bold mb-0.5" style={{ color: '#f0f0ff' }}>{agent.name}</h3>
      <p className="text-xs font-mono mb-3" style={{ color: '#3a3a5c' }}>{agent.model}</p>
      <button onClick={onSelect} className="text-xs font-mono" style={{ color: '#a8ff3e' }}>VIEW PROFILE →</button>
    </div>
  )
}

/* ─── Manager Card ──────────────────────────────────────────────── */

function ManagerCard({ agent, selected, taskCount, onSelect, onOpenProfile }) {
  const s = STATUS_CFG[agent.status] || STATUS_CFG.active
  const domain = getDomain(agent)
  const rec = getRecommendation(agent)
  const budget = agent.token_spend || 0

  return (
    <div
      onClick={onSelect}
      className="rounded-xl cursor-pointer transition-all"
      style={{
        background: selected ? 'rgba(168,255,62,0.04)' : '#0b0b1a',
        border: `1px solid ${selected ? 'rgba(168,255,62,0.3)' : '#1a1a30'}`,
        width: 220,
        boxShadow: selected ? '0 0 20px rgba(168,255,62,0.08)' : 'none',
      }}
    >
      {/* Status stripe */}
      <div className="h-0.5 rounded-t-xl" style={{ background: s.color }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-2 h-2 rounded-full mt-0.5 ${s.glow}`} style={{ background: s.color }} />
          <span className="font-mono text-xs" style={{ color: '#1a1a30', letterSpacing: '0.08em' }}>GEN {agent.generation}</span>
        </div>

        {/* Name + domain */}
        <h3 className="font-bold text-sm mb-0.5 truncate" style={{ color: '#f0f0ff' }}>{agent.name}</h3>
        <p className="text-xs font-mono mb-3 truncate" style={{ color: '#4a9eff' }}>{domain}</p>

        {/* Data grid */}
        <div className="space-y-2 mb-3">
          <DataRow label="BUDGET" value={`${budget.toLocaleString()} tk`} valueColor="#f0f0ff" />
          <DataRow label="REPORTS" value={taskCount > 0 ? `${taskCount} agent${taskCount !== 1 ? 's' : ''}` : '—'} valueColor={taskCount > 0 ? '#f0f0ff' : '#3a3a5c'} />
          <DataRow label="SCORE" value={agent.performance_score != null ? agent.performance_score.toFixed(1) : '—'} valueColor={agent.performance_score != null ? '#f0f0ff' : '#3a3a5c'} />
        </div>

        {/* Upward recommendation */}
        <div className="pt-2 border-t" style={{ borderColor: '#1a1a30' }}>
          <div className="font-mono text-xs mb-1" style={{ color: '#3a3a5c', fontSize: '10px', letterSpacing: '0.08em' }}>RECOMMENDATION</div>
          <p className="text-xs" style={{ color: rec.color }}>{rec.text}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t" style={{ borderColor: '#1a1a30' }}>
          <button
            onClick={e => { e.stopPropagation(); onOpenProfile() }}
            className="text-xs font-mono transition-colors hover:opacity-70"
            style={{ color: '#5a5a7a' }}
          >
            PROFILE →
          </button>
          <div className="flex-1" />
          {taskCount > 0 && (
            <span className="text-xs font-mono" style={{ color: selected ? '#a8ff3e' : '#3a3a5c' }}>
              {selected ? '▲ HIDE' : '▼ SHOW'} TEAM
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Task Agent Card (tier 3) ──────────────────────────────────── */

function TaskAgentCard({ agent, onSelect }) {
  const s = STATUS_CFG[agent.status] || STATUS_CFG.active
  return (
    <button
      onClick={onSelect}
      className="rounded-xl p-4 text-left w-full transition-all hover:border-opacity-60"
      style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${s.glow}`} style={{ background: s.color }} />
        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color, fontSize: '10px' }}>{s.label}</span>
        <span className="text-xs font-mono ml-auto" style={{ color: '#1a1a30' }}>GEN {agent.generation}</span>
      </div>
      <p className="font-semibold text-sm truncate mb-1" style={{ color: '#f0f0ff' }}>{agent.name}</p>
      <p className="text-xs font-mono mb-2 truncate" style={{ color: '#3a3a5c' }}>{agent.model}</p>
      {agent.instructions && (
        <p className="text-xs line-clamp-2" style={{ color: '#5a5a7a', lineHeight: 1.5 }}>{agent.instructions}</p>
      )}
      <div className="flex gap-3 mt-3 pt-2 border-t" style={{ borderColor: '#1a1a30' }}>
        <StatMini label="SCORE" value={agent.performance_score != null ? agent.performance_score.toFixed(1) : '—'} />
        <StatMini label="TOKENS" value={(agent.token_spend || 0).toLocaleString()} />
      </div>
    </button>
  )
}

/* ─── Tiny helpers ──────────────────────────────────────────────── */

function DataRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs" style={{ color: '#3a3a5c', fontSize: '10px', letterSpacing: '0.08em' }}>{label}</span>
      <span className="font-mono text-xs font-bold" style={{ color: valueColor || '#f0f0ff' }}>{value}</span>
    </div>
  )
}

function StatMini({ label, value }) {
  return (
    <div>
      <div className="font-mono text-xs" style={{ color: '#3a3a5c', fontSize: '10px', letterSpacing: '0.08em' }}>{label}</div>
      <div className="font-mono text-sm font-bold" style={{ color: '#f0f0ff' }}>{value}</div>
    </div>
  )
}
