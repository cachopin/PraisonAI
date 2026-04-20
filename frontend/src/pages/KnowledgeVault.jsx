import { useState, useEffect } from 'react'

const API = '/api'

export default function KnowledgeVault({ agents }) {
  const [bricks, setBricks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const all = []
      for (const agent of agents) {
        try {
          const res = await fetch(`${API}/agents/${agent.id}/history`)
          const history = await res.json()
          history.forEach(entry => {
            all.push({
              id: entry.id,
              agentName: agent.name,
              agentId: agent.id,
              question: entry.user_message,
              answer: entry.agent_response,
              timestamp: entry.timestamp,
              activityCount: entry.activity?.length || 0,
            })
          })
        } catch (_) {}
      }
      all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setBricks(all)
      setLoading(false)
    }
    if (agents.length > 0) load()
    else setLoading(false)
  }, [agents])

  const filtered = bricks.filter(b =>
    !search || b.question.toLowerCase().includes(search.toLowerCase()) || b.answer.toLowerCase().includes(search.toLowerCase()) || b.agentName.toLowerCase().includes(search.toLowerCase())
  )

  const iqScore = Math.min(100, Math.round((bricks.length / Math.max(agents.length, 1)) * 12))

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>KNOWLEDGE VAULT</div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Organizational Memory</h1>
          <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>Every interaction your agents have ever had. Your company getting smarter.</p>
        </div>

        {/* IQ meter */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-1 rounded-xl p-5" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
            <div className="font-mono text-xs mb-2" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>ORG IQ SCORE</div>
            <div className="font-mono text-4xl font-bold mb-1" style={{ color: '#a8ff3e' }}>{iqScore}</div>
            <div className="text-xs" style={{ color: '#5a5a7a' }}>out of 100</div>
            <div className="mt-3 h-1.5 rounded-full" style={{ background: '#1a1a30' }}>
              <div className="h-full rounded-full" style={{ width: `${iqScore}%`, background: iqScore > 60 ? '#a8ff3e' : iqScore > 30 ? '#f5c518' : '#ff3d3d' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: '#3a3a5c' }}>
              {iqScore < 20 ? 'Just getting started.' : iqScore < 50 ? 'Building institutional knowledge.' : iqScore < 80 ? 'Strong org memory.' : 'Knowledge-rich company.'}
            </p>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: 'KNOWLEDGE BRICKS', value: bricks.length, color: '#a8ff3e' },
              { label: 'AGENTS CONTRIBUTING', value: agents.length, color: '#4a9eff' },
              { label: 'SEARCH RESULTS', value: filtered.length, color: '#f0f0ff' },
              { label: 'LATEST UPDATE', value: bricks.length > 0 ? new Date(bricks[0].timestamp).toLocaleDateString() : '—', color: '#5a5a7a' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
                <div className="font-mono text-xs mb-2" style={{ color: '#3a3a5c', letterSpacing: '0.08em' }}>{s.label}</div>
                <div className="font-mono text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How inheritance works */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(74,158,255,0.04)', border: '1px solid rgba(74,158,255,0.15)' }}>
          <div className="font-mono text-xs mb-2" style={{ color: '#4a9eff', letterSpacing: '0.1em' }}>HOW THIS WORKS</div>
          <p className="text-xs leading-relaxed" style={{ color: '#5a5a7a' }}>
            Every task your agents complete adds a "knowledge brick" to this vault. When you hire a new agent or evolve an existing one, it inherits the context of its parent — your company gets smarter with every interaction. No technical setup required.
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge bricks by topic, answer, or agent..."
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#d0d0e8', caretColor: '#a8ff3e' }} />
        </div>

        {/* Bricks */}
        {loading ? (
          <div className="text-center py-10 font-mono text-sm" style={{ color: '#3a3a5c' }}>Loading vault...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="font-mono text-3xl mb-3" style={{ color: '#1a1a30' }}>⬡</div>
            <p className="text-sm" style={{ color: '#3a3a5c' }}>{bricks.length === 0 ? 'No knowledge yet. Dispatch your first job.' : 'No bricks match your search.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(brick => (
              <div key={brick.id} className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(168,255,62,0.08)', color: '#a8ff3e' }}>{brick.agentName}</span>
                  <span className="text-xs font-mono" style={{ color: '#3a3a5c' }}>{new Date(brick.timestamp).toLocaleString()}</span>
                  {brick.activityCount > 0 && <span className="text-xs font-mono ml-auto" style={{ color: '#3a3a5c' }}>{brick.activityCount} steps</span>}
                </div>
                <p className="text-sm font-medium mb-2" style={{ color: '#d0d0e8' }}>{brick.question}</p>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: '#5a5a7a' }}>{brick.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
