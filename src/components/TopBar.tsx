import { useEffect, useState } from 'react'
import { useTriageStore } from '../store/triageStore'

interface Props {
  onAddCustomer: () => void
}

export default function TopBar({ onAddCustomer }: Props) {
  const [now, setNow] = useState(new Date())
  const customers = useTriageStore((s) => s.customers)
  const activeExceptions = useTriageStore((s) => s.getActiveExceptions())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const waitingCount = customers.filter(
    (c) => c.status === 'waiting' || c.status === 'skin_test' || c.status === 'photo_room'
  ).length
  const inConsultCount = customers.filter(
    (c) => c.status === 'consultation' || c.status === 'injection_consult' || c.status === 'treatment'
  ).length
  const completedCount = customers.filter((c) => c.status === 'completed').length

  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  })
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false })

  const handleExport = () => {
    const records = customers
      .filter((c) => c.status !== 'completed' && c.status !== 'cancelled')
      .map((c) => ({
        队列号: c.id,
        姓名: c.name,
        电话: c.phone,
        类型: c.type === 'first_visit' ? '初诊' : c.type === 'revisit' ? '复诊' : '陪同',
        到店时间: c.arrivalTime.toLocaleString('zh-CN'),
        当前状态: c.status,
        候诊区: c.zone + '区',
        楼层: c.floor + '楼',
        项目意向: c.intent.join('、'),
        咨询师: c.consultantId || '-',
        医生: c.doctorId || '-',
        备注: c.notes || '',
      }))

    const header = Object.keys(records[0] || {}).join(',')
    const rows = records.map((r) => Object.values(r).map((v) => `"${v}"`).join(','))
    const csv = '\ufeff' + [header, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `接待交接清单_${now.toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={styles.topBar}>
      <div style={styles.leftSection}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>+</span>
          <div>
            <div style={styles.title}>医美初诊导诊系统</div>
            <div style={styles.subtitle}>Aesthetic Clinic Triage</div>
          </div>
        </div>

        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={{ ...styles.statNum, color: 'var(--accent-info)' }}>{waitingCount}</span>
            <span style={styles.statLabel}>候诊中</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={{ ...styles.statNum, color: 'var(--accent-success)' }}>{inConsultCount}</span>
            <span style={styles.statLabel}>接诊中</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={{ ...styles.statNum, color: 'var(--text-muted)' }}>{completedCount}</span>
            <span style={styles.statLabel}>已完成</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={{ ...styles.statNum, color: 'var(--accent-warning)' }}>{customers.length}</span>
            <span style={styles.statLabel}>今日到诊</span>
          </div>
          {activeExceptions.length > 0 && (
            <>
              <div style={styles.statDivider} />
              <div style={styles.statItem}>
                <span style={{ ...styles.statNum, color: 'var(--accent-primary)' }}>
                  {activeExceptions.length}
                </span>
                <span style={styles.statLabel}>异常提醒</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={styles.rightSection}>
        <div style={styles.datetime}>
          <div style={styles.date}>{dateStr}</div>
          <div style={styles.time}>{timeStr}</div>
        </div>

        <button style={styles.btnSecondary} onClick={handleExport}>
          📋 导出交接清单
        </button>
        <button style={styles.btnPrimary} onClick={onAddCustomer}>
          + 新增临时顾客
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    minHeight: '64px',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    background: 'linear-gradient(135deg, var(--accent-primary), #f97316)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    color: 'white',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '8px 20px',
    background: 'var(--bg-primary)',
    borderRadius: '10px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statNum: {
    fontSize: '22px',
    fontWeight: 700,
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    background: 'var(--border-color)',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  datetime: {
    textAlign: 'right',
    marginRight: '8px',
  },
  date: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  time: {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  btnSecondary: {
    padding: '10px 16px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background 0.2s',
  },
  btnPrimary: {
    padding: '10px 20px',
    background: 'var(--accent-primary)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'background 0.2s',
  },
}
