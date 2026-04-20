import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import CommandCenter from './pages/CommandCenter'
import Workforce from './pages/Workforce'
import AgentProfile from './pages/AgentProfile'
import HireWizard from './pages/HireWizard'
import KnowledgeVault from './pages/KnowledgeVault'
import Collaborators from './pages/Collaborators'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

const API = '/api'

export default function App() {
  const [page, setPage] = useState('command')
  const [agents, setAgents] = useState([])
  const [selectedAgentId, setSelectedAgentId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API}/agents`)
      const data = await res.json()
      setAgents(data)
    } catch (e) { console.error('fetchAgents', e) }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const navigate = (p, agentId = null) => {
    setPage(p)
    if (agentId) setSelectedAgentId(agentId)
  }

  const handleHireSuccess = (agent) => {
    setAgents(prev => [...prev, agent])
    setSelectedAgentId(agent.id)
    setPage('profile')
  }

  const handleAgentUpdated = (updated) => {
    setAgents(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  const handleAgentDeleted = (id) => {
    setAgents(prev => prev.filter(a => a.id !== id))
    setPage('workforce')
    setSelectedAgentId(null)
  }

  const renderPage = () => {
    switch (page) {
      case 'command': return <CommandCenter agents={agents} onNavigate={navigate} onRefresh={fetchAgents} />
      case 'workforce': return <Workforce agents={agents} onSelectAgent={(id) => navigate('profile', id)} onNavigate={navigate} onRefresh={fetchAgents} />
      case 'profile': return <AgentProfile agentId={selectedAgentId} agents={agents} onUpdated={handleAgentUpdated} onDeleted={handleAgentDeleted} onNavigate={navigate} />
      case 'hire': return <HireWizard agents={agents} onSuccess={handleHireSuccess} onCancel={() => setPage('workforce')} />
      case 'vault': return <KnowledgeVault agents={agents} />
      case 'collaborators': return <Collaborators agents={agents} />
      case 'reports': return <Reports agents={agents} />
      case 'settings': return <Settings agents={agents} onRefresh={fetchAgents} />
      default: return <CommandCenter agents={agents} onNavigate={navigate} onRefresh={fetchAgents} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#060610' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 md:hidden" style={{ background: 'rgba(6,6,16,0.8)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative z-30 h-full shrink-0 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`} style={{ width: '220px' }}>
        <Sidebar page={page} onNavigate={(p) => { navigate(p); setSidebarOpen(false) }} agents={agents} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center px-4 py-2 border-b md:hidden shrink-0" style={{ background: '#0b0b1a', borderColor: '#1a1a30' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 mr-3 rounded" style={{ color: '#a8ff3e' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-mono font-bold text-sm" style={{ color: '#a8ff3e' }}>CAKE</span>
        </div>

        <div className="flex-1 overflow-hidden">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}
