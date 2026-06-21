import { useState } from 'react'
import { useTriageStore } from './store/triageStore'
import TopBar from './components/TopBar'
import TodayArrivals from './components/TodayArrivals'
import WaitingZones from './components/WaitingZones'
import CustomerDetail from './components/CustomerDetail'
import RoomNavigation from './components/RoomNavigation'
import ExceptionPanel from './components/ExceptionPanel'
import AddCustomerModal from './components/AddCustomerModal'

export default function App() {
  const activePanel = useTriageStore((s) => s.activePanel)
  const setActivePanel = useTriageStore((s) => s.setActivePanel)
  const [showAddModal, setShowAddModal] = useState(false)

  const panels = [
    { key: 'today', label: '今日到诊' },
    { key: 'zones', label: '候诊分区' },
    { key: 'detail', label: '顾客详情' },
    { key: 'navigation', label: '房间导航' },
    { key: 'exceptions', label: '异常处理' },
  ] as const

  return (
    <div style={styles.app}>
      <TopBar onAddCustomer={() => setShowAddModal(true)} />

      <div style={styles.tabBar}>
        {panels.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePanel(p.key)}
            style={{
              ...styles.tabButton,
              ...(activePanel === p.key ? styles.tabButtonActive : {}),
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activePanel === 'today' && <TodayArrivals />}
        {activePanel === 'zones' && <WaitingZones />}
        {activePanel === 'detail' && <CustomerDetail />}
        {activePanel === 'navigation' && <RoomNavigation />}
        {activePanel === 'exceptions' && <ExceptionPanel />}
      </div>

      {showAddModal && <AddCustomerModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
  },
  tabBar: {
    display: 'flex',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    padding: '0 24px',
    gap: '4px',
  },
  tabButton: {
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    color: 'var(--text-primary)',
    borderBottomColor: 'var(--accent-primary)',
    background: 'var(--bg-primary)',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    padding: '20px',
  },
}
