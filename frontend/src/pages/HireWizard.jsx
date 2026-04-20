import { useState } from 'react'

const API = '/api'

const SUGGESTIONS = [
  { name: 'Research Analyst', instructions: 'You search the web, summarize findings clearly, and provide cited information. You are thorough, accurate, and concise.', model: 'gpt-4o-mini' },
  { name: 'Code Engineer', instructions: 'You write clean, well-commented code. You debug issues, explain decisions, and suggest improvements. Languages: Python, JS, and more.', model: 'gpt-4o-mini' },
  { name: 'Content Writer', instructions: 'You write engaging, on-brand content — blog posts, emails, social copy. You match tone to context and optimize for clarity.', model: 'gpt-4o-mini' },
  { name: 'Data Analyst', instructions: 'You interpret data, identify trends, and surface actionable insights. You explain findings in plain language for non-technical audiences.', model: 'gpt-4o' },
  { name: 'Customer Support', instructions: 'You handle customer inquiries with empathy and precision. You resolve issues quickly and escalate when needed.', model: 'gpt-4o-mini' },
  { name: 'Finance Monitor', instructions: 'You track financial metrics, flag anomalies, and generate summaries. You are precise, conservative, and never speculate.', model: 'gpt-4o' },
]

const MODELS = ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-5-sonnet', 'gemini-1.5-flash']

const STEP_COST = { 'gpt-4o-mini': '$0.15/1M', 'gpt-4o': '$2.50/1M', 'claude-3-haiku': '$0.25/1M', 'claude-3-5-sonnet': '$3.00/1M', 'gemini-1.5-flash': '$0.075/1M' }

export default function HireWizard({ agents, onSuccess, onCancel }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', instructions: '', model: 'gpt-4o-mini' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSuggestion = (s) => {
    setForm({ name: s.name, instructions: s.instructions, model: s.model })
    setStep(2)
  }

  const handleConfirm = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      const agent = await res.json()
      setStep(3)
      setTimeout(() => onSuccess(agent), 1200)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: '#060610' }}>
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onCancel} className="text-xs font-mono transition-colors" style={{ color: '#3a3a5c' }}>← CANCEL</button>
          <div className="flex-1" />
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all"
                  style={{ background: step >= s ? '#a8ff3e' : '#1a1a30', color: step >= s ? '#060610' : '#3a3a5c' }}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className="w-8 h-px" style={{ background: step > s ? '#a8ff3e' : '#1a1a30' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Pick a role */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>STEP 1 OF 3</div>
              <h2 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>What do you need done?</h2>
              <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>Pick a suggested role or describe your own.</p>
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {SUGGESTIONS.map(s => (
                <button key={s.name} onClick={() => handleSuggestion(s)}
                  className="rounded-xl p-4 text-left transition-all hover:border-lime-dim"
                  style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
                  <div className="font-semibold mb-1" style={{ color: '#f0f0ff' }}>{s.name}</div>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#5a5a7a' }}>{s.instructions}</p>
                  <div className="mt-2 text-xs font-mono" style={{ color: '#3a3a5c' }}>{s.model}</div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button onClick={() => setStep(2)} className="text-xs font-mono" style={{ color: '#a8ff3e' }}>
                OR DEFINE YOUR OWN ROLE →
              </button>
            </div>
          </>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>STEP 2 OF 3</div>
              <h2 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Configure your agent</h2>
              <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>Name it, instruct it, and choose its model.</p>
            </div>

            <div className="space-y-4">
              <Field label="AGENT NAME">
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Research Analyst"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#d0d0e8', caretColor: '#a8ff3e' }} />
              </Field>

              <Field label="WHAT WILL IT DO">
                <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)}
                  placeholder="Describe how this agent should behave, what it specializes in, and how it should respond..."
                  rows={5} className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  style={{ background: '#0b0b1a', border: '1px solid #1a1a30', color: '#d0d0e8', caretColor: '#a8ff3e' }} />
              </Field>

              <Field label="MODEL">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MODELS.map(m => (
                    <button key={m} onClick={() => set('model', m)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                      style={{
                        background: form.model === m ? 'rgba(168,255,62,0.06)' : '#0b0b1a',
                        border: `1px solid ${form.model === m ? 'rgba(168,255,62,0.3)' : '#1a1a30'}`,
                      }}>
                      <span className="text-sm font-mono" style={{ color: form.model === m ? '#a8ff3e' : '#d0d0e8' }}>{m}</span>
                      <span className="text-xs font-mono" style={{ color: '#3a3a5c' }}>{STEP_COST[m]}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {error && <p className="mt-3 text-xs font-mono" style={{ color: '#ff3d3d' }}>{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl text-sm font-mono" style={{ border: '1px solid #1a1a30', color: '#5a5a7a' }}>BACK</button>
              <button onClick={() => { if (!form.name.trim()) { setError('Name required'); return } setError(''); setStep(3) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-mono font-bold transition-all"
                style={{ background: '#a8ff3e', color: '#060610' }}>
                REVIEW HIRE →
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && !loading && (
          <>
            <div className="mb-6">
              <div className="font-mono text-xs tracking-widest mb-1" style={{ color: '#3a3a5c' }}>STEP 3 OF 3</div>
              <h2 className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>Confirm the hire</h2>
              <p className="text-sm mt-1" style={{ color: '#5a5a7a' }}>Review before deploying to your fleet.</p>
            </div>

            <div className="rounded-xl p-5 mb-6" style={{ background: '#0b0b1a', border: '1px solid #1a1a30' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: 'rgba(168,255,62,0.1)', color: '#a8ff3e' }}>
                  {form.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold" style={{ color: '#f0f0ff' }}>{form.name}</div>
                  <div className="text-xs font-mono" style={{ color: '#3a3a5c' }}>{form.model} · {STEP_COST[form.model]}</div>
                </div>
                <div className="ml-auto px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(168,255,62,0.1)', color: '#a8ff3e' }}>ACTIVE</div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#5a5a7a' }}>{form.instructions || 'No instructions provided.'}</p>
            </div>

            {error && <p className="mb-3 text-xs font-mono" style={{ color: '#ff3d3d' }}>{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl text-sm font-mono" style={{ border: '1px solid #1a1a30', color: '#5a5a7a' }}>BACK</button>
              <button onClick={handleConfirm} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-mono font-bold transition-all"
                style={{ background: '#a8ff3e', color: '#060610' }}>
                CONFIRM HIRE
              </button>
            </div>
          </>
        )}

        {/* Success state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 font-mono text-2xl lime-glow" style={{ background: 'rgba(168,255,62,0.1)', border: '1px solid rgba(168,255,62,0.3)', color: '#a8ff3e' }}>⬡</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#f0f0ff' }}>{form.name} is joining your fleet</h3>
            <p className="text-sm" style={{ color: '#5a5a7a' }}>Deploying to workforce...</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="font-mono text-xs mb-2" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>{label}</div>
      {children}
    </div>
  )
}
