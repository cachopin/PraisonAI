import { useState } from 'react'

const API = '/api'

const REPORT_TYPES = [
  { id: 'ops', label: 'Weekly Ops Summary', icon: '📋', schedule: 'Every Monday 08:00', description: 'Tasks completed, agent uptime, blocked items.' },
  { id: 'roi', label: 'Monthly ROI Sheet', icon: '💰', schedule: '1st of month', description: 'Token spend, estimated value generated, cost per task.' },
  { id: 'fitness', label: 'Agent Fitness Report', icon: '🏃', schedule: 'Every Friday', description: 'Performance scores, health trends, hire/fire recommendations.' },
  { id: 'vault', label: 'Vault Growth Report', icon: '🧠', schedule: 'Every Sunday', description: 'New knowledge bricks added, coverage by domain, Org IQ delta.' },
]

export default function Reports({ agents }) {
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState('')
  const [querying, setQuerying] = useState(false)
  const [enabled, setEnabled] = useState(['ops', 'fitness'])

  const totalTokens = agents.reduce((s, a) => s + (a.token_spend || 0), 0)
  const avgScore = agents.length > 0
    ? (agents.reduce((s, a) => s + (a.performance_score || 0), 0) / agents.length).toFixed(1) : '—'
  const activeCount = agents.filter(a => a.status === 'active').length

  const handleQuery = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setQuerying(true)
    setQueryResult('')
    // Demo response — in production this would call an agent
    await new Promise(r => setTimeout(r, 800))
    const q = query.toLowerCase()
    if (q.includes('token') || q.includes('cost')) {
      setQueryResult(`Total token spend across all agents: ${totalTokens.toLocaleString()} tokens. At average model pricing, estimated cost is ~$${(totalTokens * 0.00015).toFixed(2)}.`)
    } else if (q.includes('agent') || q.includes('active')) {
      setQueryResult(`You have ${agents.length} total agents: ${activeCount} active, ${agents.filter(a => a.status === 'auditing').length} on probation, ${agents.filter(a => a.status === 'decommissioned').length} decommissioned.`)
    } else if (q.includes('score') || q.includes('perform')) {
      setQueryResult(`Average performance score across your fleet: ${avgScore}/10. ${avgScore > 7 ? 'Your agents are performing well.' : avgScore > 4 ? 'Performance is moderate — consider retraining underperformers.' : 'Performance needs attention.'}`)
    } else {
      setQueryResult(`Based on current data: ${activeCount} active agents, ${totalTokens.toLocaleString()} tokens spent, average score ${avgScore}. For more specific insights, try asking about tokens, costs, active agents, or performance scores.`)
    }
    setQuerying(false)
  }

  const toggleReport = (id) => {
    setEnabled(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>REPORTS</div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Automated Intelligence</h1>
          <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>Delivered on schedule. Query anything in plain English.</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'TOTAL TOKENS', value: totalTokens.toLocaleString(), color: '#4a9eff' },
            { label: 'AVG SCORE', value: avgScore, color: '#a8ff3e' },
            { label: 'ACTIVE AGENTS', value: activeCount, color: '#f5c518' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
              <div className="font-mono text-xs mb-2" style={{ color: '#3a3a5c', letterSpacing: '0.08em' }}>{s.label}</div>
              <div className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Natural language query */}
        <div className="rounded-xl mb-6" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#1a1a30' }}>
            <div className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>NATURAL LANGUAGE QUERY</div>
          </div>
          <form onSubmit={handleQuery} className="p-4">
            <div className="flex gap-2 mb-3">
              <span className="font-mono self-center" style={{ color: '#a8ff3e' }}>›</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='e.g. "How much did agents cost last month?" or "Which agents are underperforming?"'
                className="flex-1 bg-transparent text-sm"
                style={{ color: '#d0d0e8', caretColor: '#a8ff3e' }}
              />
              <button type="submit" disabled={querying || !query.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all"
                style={{ background: query.trim() ? '#a8ff3e' : '#1a1a30', color: query.trim() ? '#060610' : '#3a3a5c' }}>
                {querying ? '...' : 'ASK'}
              </button>
            </div>
            {queryResult && (
              <div className="rounded-lg p-3 border-t pt-3" style={{ borderColor: '#1a1a30' }}>
                <p className="text-sm leading-relaxed" style={{ color: '#d0d0e8' }}>{queryResult}</p>
              </div>
            )}
          </form>
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {['How much did agents cost?', 'Which agents are active?', 'What is the average score?'].map(q => (
              <button key={q} onClick={() => setQuery(q)} className="text-xs px-2 py-1 rounded font-mono transition-colors" style={{ background: '#0f0f22', border: '1px solid #1a1a30', color: '#5a5a7a' }}>{q}</button>
            ))}
          </div>
        </div>

        {/* Scheduled reports */}
        <div>
          <div className="font-mono text-xs tracking-widest mb-3" style={{ color: '#3a3a5c' }}>SCHEDULED REPORTS</div>
          <div className="space-y-3">
            {REPORT_TYPES.map(r => {
              const on = enabled.includes(r.id)
              return (
                <div key={r.id} className="rounded-xl p-4 flex items-start gap-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
                  <div className="text-2xl shrink-0 mt-0.5">{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" style={{ color: '#f0f0ff' }}>{r.label}</span>
                      {on && <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(168,255,62,0.08)', color: '#a8ff3e', fontSize: '10px' }}>ENABLED</span>}
                    </div>
                    <p className="text-xs mb-1.5" style={{ color: '#5a5a7a' }}>{r.description}</p>
                    <p className="text-xs font-mono" style={{ color: '#3a3a5c' }}>Schedule: {r.schedule}</p>
                  </div>
                  <button onClick={() => toggleReport(r.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 transition-all"
                    style={{
                      background: on ? 'rgba(168,255,62,0.1)' : 'transparent',
                      border: `1px solid ${on ? 'rgba(168,255,62,0.3)' : '#1a1a30'}`,
                      color: on ? '#a8ff3e' : '#3a3a5c',
                    }}>
                    {on ? 'ON' : 'OFF'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
