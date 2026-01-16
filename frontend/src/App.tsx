import { useState } from 'react'
import CaptureTab from './pages/CaptureTab'
import TodayTab from './pages/TodayTab'

type Tab = 'capture' | 'today'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('capture')

  return (
    <div className="app">
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'capture' ? 'active' : ''}`}
          onClick={() => setActiveTab('capture')}
        >
          Capture
        </button>
        <button
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
      </nav>

      <main className="tab-content">
        {activeTab === 'capture' ? <CaptureTab /> : <TodayTab />}
      </main>
    </div>
  )
}

export default App
