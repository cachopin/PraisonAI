import { useState } from 'react'

const DEMO_COLLABORATORS = [
  { id: 'c1', name: 'Legal Counsel', type: 'lawyer', access: ['reports', 'contracts'], status: 'active', lastSeen: '2 hours ago', email: 'legal@firm.com' },
  { id: 'c2', name: 'Accountant', type: 'accountant', access: ['reports', 'finance'], status: 'active', lastSeen: '1 day ago', email: 'cpa@accounting.co' },
  { id: 'c3', name: 'Tech Advisor', type: 'engineer', access: ['workforce', 'vault'], status: 'pending', lastSeen: 'Invite pending', email: 'advisor@tech.io' },
]

const ACCESS_SCOPES = ['workforce', 'reports', 'vault', 'finance', 'contracts', 'settings']

const TYPE_ICONS = { lawyer: '⚖️', accountant: '📊', engineer: '⚙️', consultant: '💼', other: '👤' }

export default function Collaborators({ agents }) {
  const [collabs, setCollabs] = useState(DEMO_COLLABORATORS)
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState({ name: '', email: '', type: 'consultant', access: [] })

  const toggleAccess = (scope) => {
    setInvite(f => ({
      ...f, access: f.access.includes(scope) ? f.access.filter(s => s !== scope) : [...f.access, scope]
    }))
  }

  const handleInvite = () => {
    if (!invite.name || !invite.email) return
    const newCollab = { id: `c${Date.now()}`, ...invite, status: 'pending', lastSeen: 'Invite pending' }
    setCollabs(prev => [...prev, newCollab])
    setInvite({ name: '', email: '', type: 'consultant', access: [] })
    setShowInvite(false)
  }

  const handleRevoke = (id) => {
    if (!window.confirm('Revoke this collaborator\'s access?')) return
    setCollabs(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>COLLABORATORS</div>
            <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Guest Pass</h1>
            <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>External experts with scoped access. They see only what you allow.</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all" style={{ background: '#a8ff3e', color: '#060610' }}>
            + INVITE EXPERT
          </button>
        </div>

        {/* Access philosophy */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(245,197,24,0.04)', border: '1px solid rgba(245,197,24,0.15)' }}>
          <div className="font-mono text-xs mb-2" style={{ color: '#f5c518', letterSpacing: '0.1em' }}>ACCESS MODEL</div>
          <p className="text-xs leading-relaxed" style={{ color: '#5a5a7a' }}>
            Collaborators are the human expert layer. A lawyer, accountant, or engineer gets a scoped invite — they see only what you allow. They can comment, approve, or assign tasks. They never touch the Vault or agent configs directly.
          </p>
        </div>

        {/* Collab list */}
        <div className="space-y-3 mb-5">
          {collabs.map(c => (
            <div key={c.id} className="rounded-xl p-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: '#0f0f22', border: '1px solid #1a1a30' }}>
                  {TYPE_ICONS[c.type] || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium" style={{ color: '#f0f0ff' }}>{c.name}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{
                      background: c.status === 'active' ? 'rgba(168,255,62,0.08)' : 'rgba(245,197,24,0.08)',
                      color: c.status === 'active' ? '#a8ff3e' : '#f5c518',
                      fontSize: '10px',
                    }}>{c.status === 'active' ? 'ACTIVE' : 'PENDING'}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: '#3a3a5c' }}>{c.email} · {c.type}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {c.access.map(scope => (
                      <span key={scope} className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#0f0f22', border: '1px solid #1a1a30', color: '#5a5a7a' }}>{scope}</span>
                    ))}
                    {c.access.length === 0 && <span className="text-xs" style={{ color: '#3a3a5c' }}>No access scopes assigned</span>}
                  </div>
                  <p className="text-xs font-mono" style={{ color: '#3a3a5c' }}>Last seen: {c.lastSeen}</p>
                </div>
                <button onClick={() => handleRevoke(c.id)} className="text-xs font-mono shrink-0 transition-colors px-2 py-1 rounded" style={{ color: '#ff3d3d', border: '1px solid rgba(255,61,61,0.2)' }}>
                  REVOKE
                </button>
              </div>
            </div>
          ))}
          {collabs.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: '#3a3a5c' }}>No collaborators invited yet.</div>
          )}
        </div>

        {/* Invite modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(6,6,16,0.85)' }}>
            <div className="w-full max-w-md rounded-2xl" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#1a1a30' }}>
                <span className="font-mono text-xs tracking-widest" style={{ color: '#3a3a5c' }}>INVITE COLLABORATOR</span>
                <button onClick={() => setShowInvite(false)} style={{ color: '#3a3a5c' }}>✕</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <Field label="NAME"><input value={invite.name} onChange={e => setInvite(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }} /></Field>
                <Field label="EMAIL"><input value={invite.email} onChange={e => setInvite(f => ({ ...f, email: e.target.value }))} placeholder="expert@firm.com" type="email" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }} /></Field>
                <Field label="TYPE">
                  <select value={invite.type} onChange={e => setInvite(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }}>
                    {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="ACCESS SCOPES">
                  <div className="flex flex-wrap gap-2">
                    {ACCESS_SCOPES.map(scope => {
                      const active = invite.access.includes(scope)
                      return (
                        <button key={scope} onClick={() => toggleAccess(scope)} className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all" style={{ background: active ? 'rgba(168,255,62,0.1)' : '#0f0f22', border: `1px solid ${active ? 'rgba(168,255,62,0.3)' : '#1a1a30'}`, color: active ? '#a8ff3e' : '#5a5a7a' }}>
                          {scope}
                        </button>
                      )
                    })}
                  </div>
                </Field>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t justify-end" style={{ borderColor: '#1a1a30' }}>
                <button onClick={() => setShowInvite(false)} className="px-4 py-2 rounded-lg text-xs font-mono" style={{ border: '1px solid #1a1a30', color: '#5a5a7a' }}>CANCEL</button>
                <button onClick={handleInvite} className="px-4 py-2 rounded-lg text-xs font-mono font-bold" style={{ background: '#a8ff3e', color: '#060610' }}>SEND INVITE</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <div><div className="font-mono text-xs mb-1.5" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>{label}</div>{children}</div>
}
