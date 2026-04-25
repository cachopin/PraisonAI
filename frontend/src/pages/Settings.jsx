import { useState, useEffect } from 'react'

const API = '/api'
const DEFAULT_MODELS = ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-5-sonnet', 'gemini-1.5-flash']
const LS_KEY = 'cake_settings'

const DEFAULTS = {
  company: { name: 'My Company', industry: 'General', timezone: 'UTC' },
  defaults: { model: 'gpt-4o-mini', autoFire: false, autoFireThreshold: 3.0, arenaFreq: 'weekly' },
  notifications: { slack: '', email: '' },
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULTS
    const saved = JSON.parse(raw)
    return {
      company: { ...DEFAULTS.company, ...saved.company },
      defaults: { ...DEFAULTS.defaults, ...saved.defaults },
      notifications: { ...DEFAULTS.notifications, ...saved.notifications },
    }
  } catch (_) { return DEFAULTS }
}

export default function Settings({ agents, onRefresh }) {
  const [company, setCompany] = useState(() => loadSettings().company)
  const [defaults, setDefaults] = useState(() => loadSettings().defaults)
  const [notifications, setNotifications] = useState(() => loadSettings().notifications)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem(LS_KEY, JSON.stringify({ company, defaults, notifications }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePurge = async () => {
    if (!window.confirm('Delete ALL agents and data? This cannot be undone.')) return
    for (const agent of agents) {
      await fetch(`${API}/agents/${agent.id}`, { method: 'DELETE' }).catch(() => {})
    }
    onRefresh()
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>SETTINGS</div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Company Configuration</h1>
          <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>Changes are saved to your browser and persist across sessions.</p>
        </div>

        <Section title="COMPANY PROFILE">
          <div className="space-y-3">
            <Field label="COMPANY NAME">
              <input value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="INDUSTRY">
                <select value={company.industry} onChange={e => setCompany(c => ({ ...c, industry: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }}>
                  {['General', 'Technology', 'Retail', 'Healthcare', 'Legal', 'Finance', 'Creative', 'Manufacturing', 'Consulting'].map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="TIMEZONE">
                <select value={company.timezone} onChange={e => setCompany(c => ({ ...c, timezone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }}>
                  {['UTC', 'US/Eastern', 'US/Pacific', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </Section>

        <Section title="AGENT DEFAULTS">
          <div className="space-y-3">
            <Field label="DEFAULT MODEL">
              <select value={defaults.model} onChange={e => setDefaults(d => ({ ...d, model: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }}>
                {DEFAULT_MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="ARENA FREQUENCY">
              <select value={defaults.arenaFreq} onChange={e => setDefaults(d => ({ ...d, arenaFreq: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }}>
                {['daily', 'weekly', 'monthly', 'never'].map(f => <option key={f}>{f}</option>)}
              </select>
            </Field>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#060610', border: '1px solid #1a1a30' }}>
              <div>
                <p className="text-sm" style={{ color: '#d0d0e8' }}>Auto-fire on low performance</p>
                <p className="text-xs mt-0.5" style={{ color: '#5a5a7a' }}>Automatically decommission agents below threshold</p>
              </div>
              <button onClick={() => setDefaults(d => ({ ...d, autoFire: !d.autoFire }))}
                className="w-10 h-5 rounded-full transition-all relative shrink-0"
                style={{ background: defaults.autoFire ? '#a8ff3e' : '#1a1a30' }}>
                <div className="w-4 h-4 rounded-full absolute top-0.5 transition-all" style={{ background: '#060610', left: defaults.autoFire ? '22px' : '2px' }} />
              </button>
            </div>
            {defaults.autoFire && (
              <Field label="AUTO-FIRE THRESHOLD (score below)">
                <input type="number" min="0" max="10" step="0.5" value={defaults.autoFireThreshold}
                  onChange={e => setDefaults(d => ({ ...d, autoFireThreshold: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }} />
              </Field>
            )}
          </div>
        </Section>

        <Section title="NOTIFICATION CHANNELS">
          <div className="space-y-3">
            <Field label="SLACK WEBHOOK URL">
              <input value={notifications.slack} onChange={e => setNotifications(n => ({ ...n, slack: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2.5 rounded-lg text-sm font-mono" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }} />
            </Field>
            <Field label="EMAIL ALERTS">
              <input value={notifications.email} onChange={e => setNotifications(n => ({ ...n, email: e.target.value }))}
                type="email" placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#060610', border: '1px solid #1a1a30', color: '#d0d0e8' }} />
            </Field>
          </div>
        </Section>

        <div className="flex items-center justify-between mb-6 p-3 rounded-xl" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
          <p className="text-xs font-mono" style={{ color: '#3a3a5c' }}>Settings are stored in your browser. No account required.</p>
          <button onClick={handleSave}
            className="px-6 py-2 rounded-lg text-sm font-mono font-bold transition-all shrink-0"
            style={{ background: saved ? '#0f2010' : '#a8ff3e', color: saved ? '#a8ff3e' : '#060610', border: saved ? '1px solid rgba(168,255,62,0.3)' : 'none' }}>
            {saved ? '✓ SAVED' : 'SAVE SETTINGS'}
          </button>
        </div>

        <div className="rounded-xl p-5" style={{ background: 'rgba(255,61,61,0.04)', border: '1px solid rgba(255,61,61,0.2)' }}>
          <div className="font-mono text-xs mb-3" style={{ color: '#ff3d3d', letterSpacing: '0.1em' }}>DANGER ZONE</div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: '#f0f0ff' }}>Purge all agents</p>
              <p className="text-xs" style={{ color: '#5a5a7a' }}>Permanently delete all agents and conversation history. Cannot be undone.</p>
            </div>
            <button onClick={handlePurge} className="px-4 py-2 rounded-lg text-xs font-mono shrink-0 ml-4" style={{ border: '1px solid rgba(255,61,61,0.4)', color: '#ff3d3d' }}>
              PURGE ALL
            </button>
          </div>
          <div className="mt-4 pt-4 border-t flex items-start justify-between" style={{ borderColor: 'rgba(255,61,61,0.1)' }}>
            <p className="text-xs" style={{ color: '#5a5a7a' }}>{agents.length} agents currently deployed</p>
            <div className="font-mono text-lg font-bold" style={{ color: agents.length > 0 ? '#ff3d3d' : '#3a3a5c' }}>{agents.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl p-5 mb-4" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
      <div className="font-mono text-xs tracking-widest mb-4" style={{ color: '#3a3a5c' }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return <div><div className="font-mono text-xs mb-1.5" style={{ color: '#3a3a5c', letterSpacing: '0.08em' }}>{label}</div>{children}</div>
}
