import type { WaitingZone } from '../types'
import { useTriageStore } from '../store/triageStore'
import {
  formatTime,
  getWaitMinutes,
  getCustomerTypeLabel,
  getCustomerTypeColor,
  getCustomerStatusColor,
  getCustomerStatusLabel,
  getStaffStatusColor,
  getStaffStatusLabel,
  getZoneColor,
  getZoneLabel,
} from '../utils/format'

const zones: { key: WaitingZone; label: string; floor: number }[] = [
  { key: 'A', label: 'A区 · 初诊咨询', floor: 1 },
  { key: 'B', label: 'B区 · 复诊咨询', floor: 2 },
  { key: 'C', label: 'C区 · 注射咨询', floor: 3 },
  { key: 'D', label: 'D区 · 治疗区', floor: 3 },
]

export default function WaitingZones() {
  const customers = useTriageStore((s) => s.customers)
  const staff = useTriageStore((s) => s.staff)
  const selectCustomer = useTriageStore((s) => s.selectCustomer)
  const setActivePanel = useTriageStore((s) => s.setActivePanel)
  const getCustomersByZone = useTriageStore((s) => s.getCustomersByZone)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>候诊分区总览</h2>
        <div style={styles.floorTabs}>
          <button style={styles.floorTabActive}>全部楼层</button>
          <button style={styles.floorTab}>1楼</button>
          <button style={styles.floorTab}>2楼</button>
          <button style={styles.floorTab}>3楼</button>
        </div>
      </div>

      <div style={styles.staffSection}>
        <div style={styles.staffSectionTitle}>
          <span style={styles.staffSectionIcon}>👥</span>
          咨询师 & 医生状态
        </div>
        <div style={styles.staffGrid}>
          {staff
            .filter((s) => s.role !== 'nurse')
            .map((s) => (
              <div key={s.id} style={styles.staffCard}>
                <div style={styles.staffAvatar}>{s.name.slice(-1)}</div>
                <div style={styles.staffInfo}>
                  <div style={styles.staffName}>{s.name}</div>
                  <div style={styles.staffRole}>
                    {s.role === 'consultant' ? '咨询师' : '医生'}
                    {s.zone && ` · ${s.zone}区`}
                  </div>
                </div>
                <div
                  style={{
                    ...styles.staffStatus,
                    background: `${getStaffStatusColor(s.status)}20`,
                    color: getStaffStatusColor(s.status),
                  }}
                >
                  <span
                    style={{
                      ...styles.staffStatusDot,
                      background: getStaffStatusColor(s.status),
                    }}
                  />
                  {getStaffStatusLabel(s.status)}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div style={styles.zonesGrid}>
        {zones.map((zone) => {
          const zoneCustomers = getCustomersByZone(zone.key).filter(
            (c) => c.status !== 'completed' && c.status !== 'cancelled'
          )
          const waitingCount = zoneCustomers.filter((c) => c.status === 'waiting').length
          const activeCount = zoneCustomers.length - waitingCount
          const zoneStaff = staff.filter((s) => s.zone === zone.key)

          return (
            <div
              key={zone.key}
              style={{
                ...styles.zoneCard,
                borderTop: `4px solid ${getZoneColor(zone.key)}`,
              }}
            >
              <div style={styles.zoneHeader}>
                <div style={styles.zoneTitleRow}>
                <span
                  style={{
                    ...styles.zoneBadge,
                    background: getZoneColor(zone.key),
                  }}
                >
                  {getZoneLabel(zone.key)}
                </span>
                <div>
                  <div style={styles.zoneTitle}>{zone.label}</div>
                  <div style={styles.zoneFloor}>{zone.floor}楼</div>
                </div>
                </div>
                <div style={styles.zoneStats}>
                  <span style={styles.zoneStat}>
                    <span style={{ color: 'var(--accent-info)' }}>{waitingCount}</span> 候诊
                  </span>
                  <span style={styles.zoneStat}>
                    <span style={{ color: 'var(--accent-success)' }}>{activeCount}</span> 进行中
                  </span>
                </div>
              </div>

              {zoneStaff.length > 0 && (
                <div style={styles.zoneStaff}>
                  {zoneStaff.map((s) => (
                  <span key={s.id} style={styles.zoneStaffTag}>
                    {s.name}
                    <span
                      style={{
                        ...styles.zoneStaffDot,
                        background: getStaffStatusColor(s.status),
                      }}
                    />
                  </span>
                ))}
                </div>
              )}

              <div style={styles.zoneList}>
                {zoneCustomers.length === 0 ? (
                  <div style={styles.zoneEmpty}>暂无顾客</div>
                ) : (
                  zoneCustomers.map((c) => {
                    const waitMinutes = getWaitMinutes(c.waitStartAt || c.arrivalTime)
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          selectCustomer(c.id)
                          setActivePanel('detail')
                        }}
                        style={{
                          ...styles.customerItem,
                          borderLeft: `3px solid ${getCustomerTypeColor(c.type)}`,
                        }}
                      >
                        <div style={styles.customerInfo}>
                          <div style={styles.customerTop}>
                            <span style={styles.customerName}>{c.name}</span>
                            <span
                              style={{
                                ...styles.customerType,
                                background: getCustomerTypeColor(c.type),
                              }}
                            >
                              {getCustomerTypeLabel(c.type)}
                            </span>
                          </div>
                          <div style={styles.customerSub}>
                            {formatTime(c.arrivalTime)} · 等待{waitMinutes}分钟
                          </div>
                        </div>
                        <span
                          style={{
                            ...styles.customerStatus,
                            background: `${getCustomerStatusColor(c.status)}20`,
                            color: getCustomerStatusColor(c.status),
                          }}
                        >
                          {getCustomerStatusLabel(c.status)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '16px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  floorTabs: {
    display: 'flex',
    gap: '4px',
    background: 'var(--bg-secondary)',
    padding: '4px',
    borderRadius: '8px',
  },
  floorTab: {
    padding: '8px 18px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    borderRadius: '6px',
  },
  floorTabActive: {
    padding: '8px 18px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    background: 'var(--bg-primary)',
    borderRadius: '6px',
    fontWeight: 600,
  },
  staffSection: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '16px',
  },
  staffSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  },
  staffSectionIcon: {
    fontSize: '18px',
  },
  staffGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
  },
  staffCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
  },
  staffAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-purple))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  staffRole: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  staffStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  staffStatusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  zonesGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    overflowY: 'auto',
    alignContent: 'start',
  },
  zoneCard: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '280px',
  },
  zoneHeader: {
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  zoneTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  zoneBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
  },
  zoneTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  zoneFloor: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  zoneStats: {
    display: 'flex',
    gap: '12px',
  },
  zoneStat: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  zoneStaff: {
    display: 'flex',
    gap: '8px',
    padding: '0 16px 10px',
    flexWrap: 'wrap',
  },
  zoneStaffTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'var(--bg-primary)',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  zoneStaffDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  zoneList: {
    flex: 1,
    padding: '8px 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
  },
  zoneEmpty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  customerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  customerInfo: {
    flex: 1,
  },
  customerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  customerName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  customerType: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: 'white',
    fontWeight: 500,
  },
  customerSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  customerStatus: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
  },
}
