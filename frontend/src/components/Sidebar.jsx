const NAV = [
  { id: 'command', label: 'Command', icon: CommandIcon },
  { id: 'workforce', label: 'Workforce', icon: WorkforceIcon },
  { id: 'hire', label: 'Hire', icon: HireIcon },
  { id: 'vault', label: 'Knowledge', icon: VaultIcon },
  { id: 'collaborators', label: 'Collaborators', icon: CollabIcon },
  { id: 'reports', label: 'Reports', icon: ReportsIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar({ page, onNavigate, agents }) {
  const active = agents.filter(a => a.status === 'active').length
  const auditing = agents.filter(a => a.status === 'auditing').length
  const decommissioned = agents.filter(a => a.status === 'decommissioned').length

  return (
    <div className="flex flex-col h-full" style={{ background: '#0b0b1a', borderRight: '1px solid #1a1a30' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b shrink-0" style={{ borderColor: '#1a1a30' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold" style={{ background: '#a8ff3e', color: '#060610' }}>⬡</div>
          <div>
            <div className="font-mono font-bold text-sm tracking-widest" style={{ color: '#a8ff3e' }}>CAKE</div>
            <div className="text-xs" style={{ color: '#3a3a5c', letterSpacing: '0.05em' }}>SILICON WORKFORCE</div>
          </div>
        </div>
      </div>

      {/* Fleet status */}
      <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: '#1a1a30' }}>
        <div className="text-xs mb-2 font-mono" style={{ color: '#3a3a5c', letterSpacing: '0.1em' }}>FLEET STATUS</div>
        <div className="space-y-1">
          {[
            { label: 'ACTIVE', count: active, color: '#a8ff3e', glow: 'lime-dot' },
            { label: 'AUDIT', count: auditing, color: '#f5c518', glow: 'amber-dot' },
            { label: 'DECOM', count: decommissioned, color: '#ff3d3d', glow: 'danger-dot' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${s.glow}`} style={{ background: s.color }} />
                <span className="text-xs font-mono" style={{ color: '#3a3a5c', letterSpacing: '0.08em' }}>{s.label}</span>
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: s.count > 0 ? s.color : '#3a3a5c' }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map(item => {
          const Icon = item.icon
          const isActive = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all relative"
              style={{
                background: isActive ? 'rgba(168,255,62,0.06)' : 'transparent',
                color: isActive ? '#a8ff3e' : '#5a5a7a',
              }}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: '#a8ff3e' }} />}
              <Icon size={15} active={isActive} />
              <span className="text-xs font-medium tracking-wide" style={{ letterSpacing: '0.05em' }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t shrink-0" style={{ borderColor: '#1a1a30' }}>
        <div className="text-xs font-mono" style={{ color: '#1a1a30', letterSpacing: '0.1em' }}>
          v0.1.0 — PRAISONAI
        </div>
      </div>
    </div>
  )
}

function CommandIcon({ size, active }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
}
function WorkforceIcon({ size, active }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
}
function HireIcon({ size, active }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M12 4v16m8-8H4" />
  </svg>
}
function VaultIcon({ size, active }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
}
function CollabIcon({ size, active }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
}
function ReportsIcon({ size, active }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
}
function SettingsIcon({ size, active }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth={active ? 2 : 1.5} />
  </svg>
}
