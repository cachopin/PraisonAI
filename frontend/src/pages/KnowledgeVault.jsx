import { useState, useEffect, useCallback } from 'react'

const API = '/api'

const ORG_FIELDS = [
  { key: 'vision', label: 'VISION & PURPOSE', placeholder: 'What does this company exist to do? What future are we building toward?', rows: 3 },
  { key: 'guardrails', label: 'OPERATING GUARDRAILS', placeholder: 'What are the non-negotiables? What we will and will not do. How we treat people. Our ethical boundaries.', rows: 3 },
  { key: 'long_term_strategy', label: 'LONG-TERM STRATEGY', placeholder: 'Where do we want to be in 3–5 years? What bets are we making? What markets, products, or capabilities are we building?', rows: 3 },
  { key: 'short_term_priorities', label: 'SHORT-TERM PRIORITIES', placeholder: 'What are the top 3–5 priorities right now? What must be done this quarter to make progress?', rows: 3 },
]

const EMPTY_ORG = { vision: '', guardrails: '', long_term_strategy: '', short_term_priorities: '' }

export default function KnowledgeVault({ agents }) {
  const [orgKnowledge, setOrgKnowledge] = useState(EMPTY_ORG)
  const [orgDirty, setOrgDirty] = useState(false)
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgSaved, setOrgSaved] = useState(false)
  const [bricks, setBricks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchOrgKnowledge = useCallback(async () => {
    try {
      const res = await fetch(`${API}/kv/org_knowledge`)
      if (res.ok) {
        const data = await res.json()
        if (data && Object.keys(data).length > 0) setOrgKnowledge({ ...EMPTY_ORG, ...data })
      }
    } catch (_) {}
  }, [])

  useEffect(() => { fetchOrgKnowledge() }, [fetchOrgKnowledge])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const all = []
      for (const agent of agents) {
        try {
          const history = await fetch(`${API}/agents/${agent.id}/history`).then(r => r.json())
          history.forEach(entry => all.push({
            id: entry.id, agentName: agent.name, agentId: agent.id,
            question: entry.user_message, answer: entry.agent_response,
            timestamp: entry.timestamp, activityCount: entry.activity?.length || 0,
          }))
        } catch (_) {}
      }
      all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setBricks(all)
      setLoading(false)
    }
    if (agents.length > 0) load()
    else setLoading(false)
  }, [agents])

  const updateOrg = (key, val) => {
    setOrgKnowledge(o => ({ ...o, [key]: val }))
    setOrgDirty(true)
    setOrgSaved(false)
  }

  const saveOrgKnowledge = async () => {
    setOrgSaving(true)
    try {
      await fetch(`${API}/kv/org_knowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgKnowledge),
      })
      setOrgDirty(false)
      setOrgSaved(true)
      setTimeout(() => setOrgSaved(false), 2500)
    } catch (_) {}
    setOrgSaving(false)
  }

  const filtered = bricks.filter(b =>
    !search || b.question.toLowerCase().includes(search.toLowerCase()) ||
    b.answer.toLowerCase().includes(search.toLowerCase()) ||
    b.agentName.toLowerCase().includes(search.toLowerCase())
  )

  const iqScore = Math.min(100, Math.round((bricks.length / Math.max(agents.length, 1)) * 12))
  const orgFilled = Object.values(orgKnowledge).filter(v => v.trim().length > 0).length

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>KNOWLEDGE VAULT</div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Organizational Memory</h1>
          <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>Strategic docs your directors always have in mind. Plus every interaction your agents have ever had.</p>
        </div>

        {/* ── ORG STRATEGY SECTION ── */}
        <div className="rounded-2xl mb-8" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1a1a30' }}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: orgFilled >= 3 ? '#a8ff3e' : orgFilled >= 1 ? '#f5c518' : '#3a3a5c' }} />
              <span className="font-mono text-xs tracking-widest" style={{ color: '#a8ff3e', letterSpacing: '0.1em' }}>ORG STRATEGY</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#0f0f22', border: '1px solid #1a1a30', color: '#3a3a5c' }}>
                {orgFilled}/{ORG_FIELDS.length} sections filled
              </span>
            </div>
            <button
              onClick={saveOrgKnowledge}
              disabled={!orgDirty || orgSaving}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all"
              style={{
                background: orgSaved ? '#0f2010' : orgDirty ? '#a8ff3e' : '#1a1a30',
                color: orgSaved ? '#a8ff3e' : orgDirty ? '#060610' : '#3a3a5c',
                border: orgSaved ? '1px solid rgba(168,255,62,0.3)' : 'none',
              }}
            >
              {orgSaving ? 'SAVING...' : orgSaved ? '✓ SAVED' : 'SAVE STRATEGY'}
            </button>
          </div>

          <div className="p-5">
            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(74,158,255,0.04)', border: '1px solid rgba(74,158,255,0.12)' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#5a5a7a' }}>
                Directors always have this context. It shapes how they build their departments, allocate resources, and propose agents. Task agents inherit strategic context through their directors — you don't need to repeat it for each one.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ORG_FIELDS.map(f => (
                <div key={f.key}>
                  <div className="font-mono text-xs mb-2 flex items-center gap-2" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>
                    {f.label}
                    {orgKnowledge[f.key]?.trim() && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a8ff3e' }} />}
                  </div>
                  <textarea
                    value={orgKnowledge[f.key]}
                    onChange={e => updateOrg(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={f.rows}
                    className="w-full px-3 py-2.5 rounded-lg text-sm resize-none leading-relaxed"
                    style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8', caretColor: '#a8ff3e' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── AGENT BRICKS SECTION ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>AGENT KNOWLEDGE BRICKS</div>
            <p className="text-sm" style={{ color: '#5a5a7a' }}>Every interaction your agents have completed.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-xs" style={{ color: '#3a3a5c' }}>ORG IQ</div>
              <div className="font-mono text-2xl font-bold" style={{ color: '#a8ff3e' }}>{iqScore}</div>
            </div>
            <div className="h-12 w-px" style={{ background: '#1a1a30' }} />
            <div className="text-right">
              <div className="font-mono text-xs" style={{ color: '#3a3a5c' }}>BRICKS</div>
              <div className="font-mono text-2xl font-bold" style={{ color: '#f0f0ff' }}>{bricks.length}</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by topic, answer, or agent name..."
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#d0d0e8', caretColor: '#a8ff3e' }} />
        </div>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm" style={{ color: '#3a3a5c' }}>Loading vault...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="font-mono text-3xl mb-3" style={{ color: '#1a1a30' }}>⬡</div>
            <p className="text-sm" style={{ color: '#3a3a5c' }}>{bricks.length === 0 ? 'No bricks yet. Dispatch your first job from Command Center.' : 'No bricks match your search.'}</p>
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
