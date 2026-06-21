import { useState } from 'react'
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
  generateQueueNumber,
} from '../utils/format'

const zones: { key: WaitingZone; label: string; floor: number }[] = [
  { key: 'A', label: 'A区 · 初诊咨询', floor: 1 },
  { key: 'B', label: 'B区 · 复诊咨询', floor: 2 },
  { key: 'C', label: 'C区 · 注射咨询', floor: 3 },
  { key: 'D', label: 'D区 · 治疗区', floor: 3 },
]

type ViewMode = 'list' | 'board'

export default function WaitingZones() {
  const customers = useTriageStore((s) => s.customers)
  const staff = useTriageStore((s) => s.staff)
  const selectCustomer = useTriageStore((s) => s.selectCustomer)
  const setActivePanel = useTriageStore((s) => s.setActivePanel)
  const getCustomersByZone = useTriageStore((s) => s.getCustomersByZone)
  const callCustomer = useTriageStore((s) => s.callCustomer)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all')

  const activeStatuses = ['skin_test', 'photo_room', 'consultation', 'injection_consult', 'treatment'] as const

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>候诊分区总览</h2>
        <div style={styles.headerRight}>
          <div style={styles.viewToggle}>
            <button
              onClick={() => setViewMode('list')}
              style={{ ...styles.viewBtn, ...(viewMode === 'list' ? styles.viewBtnActive : {}) }}
            >
              📋 列表
            </button>
            <button
              onClick={() => setViewMode('board')}
              style={{ ...styles.viewBtn, ...(viewMode === 'board' ? styles.viewBtnActive : {}) }}
            >
              📺 叫号看板
            </button>
          </div>
          <div style={styles.floorTabs}>
            <button
              onClick={() => setSelectedFloor('all')}
              style={{ ...styles.floorTab, ...(selectedFloor === 'all' ? styles.floorTabActive : {}) }}
            >
              全部
            </button>
            {[1, 2, 3].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFloor(f)}
                style={{ ...styles.floorTab, ...(selectedFloor === f ? styles.floorTabActive : {}) }}
              >
                {f}楼
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div style={styles.boardGrid}>
          {zones
            .filter((z) => selectedFloor === 'all' || z.floor === selectedFloor)
            .map((zone) => {
              const zoneCustomers = getCustomersByZone(zone.key).filter(
                (c) => c.status !== 'completed' && c.status !== 'cancelled'
              )
              const waitingList = zoneCustomers.filter((c) => c.status === 'waiting')
              const calledList = zoneCustomers.filter((c) => c.status === 'called')
              const activeList = zoneCustomers.filter((c) => activeStatuses.includes(c.status as any))
              const overtimeList = zoneCustomers.filter(
                (c) => (c.status === 'waiting' || c.status === 'called') && getWaitMinutes(c.waitStartAt || c.arrivalTime) > 30
              )
              const nextUp = waitingList[0] || calledList[0]

              return (
                <div
                  key={zone.key}
                  style={{
                    ...styles.boardCard,
                    borderTop: `4px solid ${getZoneColor(zone.key)}`,
                  }}
                >
                  <div style={styles.boardCardHeader}>
                    <div style={styles.boardZoneInfo}>
                      <span style={{ ...styles.boardZoneBadge, background: getZoneColor(zone.key) }}>
                        {zone.key}
                      </span>
                      <div>
                        <div style={styles.boardZoneTitle}>{zone.label}</div>
                        <div style={styles.boardZoneFloor}>{zone.floor}楼</div>
                      </div>
                    </div>
                    <div style={styles.boardStats}>
                      <span style={styles.boardStat}>
                        <span style={{ color: '#6366f1', fontWeight: 700 }}>{waitingList.length}</span> 候诊
                      </span>
                      <span style={styles.boardStat}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>{activeList.length}</span> 进行中
                      </span>
                    </div>
                  </div>

                  <div style={styles.boardNextSection}>
                    <div style={styles.boardSectionLabel}>📢 下一位</div>
                    {nextUp ? (
                      <div style={styles.boardNextCard}>
                        <div style={styles.boardNextLeft}>
                          <span style={{ ...styles.boardQueueNum, background: getZoneColor(zone.key) }}>
                            {generateQueueNumber(nextUp.type, nextUp.queueOrder)}
                          </span>
                          <div>
                            <div style={styles.boardNextName}>{nextUp.name}</div>
                            <div style={styles.boardNextSub}>
                              {getCustomerTypeLabel(nextUp.type)} · 等待{getWaitMinutes(nextUp.waitStartAt || nextUp.arrivalTime)}分钟
                            </div>
                          </div>
                        </div>
                        {nextUp.status === 'waiting' && (
                          <button
                            onClick={() => callCustomer(nextUp.id)}
                            style={styles.callBtn}
                          >
                            📢 叫号
                          </button>
                        )}
                        {nextUp.status === 'called' && (
                          <span style={styles.calledBadge}>已叫号</span>
                        )}
                      </div>
                    ) : (
                      <div style={styles.boardEmpty}>暂无候诊顾客</div>
                    )}
                  </div>

                  <div style={styles.boardCalledSection}>
                    <div style={styles.boardSectionLabel}>🔔 已叫号等待</div>
                    {calledList.length > 0 ? (
                      <div style={styles.boardMiniList}>
                        {calledList.map((c) => (
                          <div key={c.id} style={styles.boardMiniItem}>
                            <span style={styles.boardMiniName}>{c.name}</span>
                            <span style={{ ...styles.boardMiniNum, background: getZoneColor(zone.key) }}>
                              {generateQueueNumber(c.type, c.queueOrder)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.boardEmptyMini}>—</div>
                    )}
                  </div>

                  <div style={styles.boardActiveSection}>
                    <div style={styles.boardSectionLabel}>🏥 当前接诊</div>
                    {activeList.length > 0 ? (
                      <div style={styles.boardMiniList}>
                        {activeList.slice(0, 4).map((c) => (
                          <div
                            key={c.id}
                            style={styles.boardActiveItem}
                            onClick={() => { selectCustomer(c.id); setActivePanel('detail') }}
                          >
                            <span style={styles.boardMiniName}>{c.name}</span>
                            <span style={{
                              ...styles.boardMiniStatus,
                              background: `${getCustomerStatusColor(c.status)}20`,
                              color: getCustomerStatusColor(c.status),
                            }}>
                              {getCustomerStatusLabel(c.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.boardEmptyMini}>暂无</div>
                    )}
                  </div>

                  {overtimeList.length > 0 && (
                    <div style={styles.boardOvertimeSection}>
                      <div style={styles.boardSectionLabel}>⏰ 超时提醒</div>
                      <div style={styles.boardMiniList}>
                        {overtimeList.map((c) => (
                          <div key={c.id} style={styles.boardOvertimeItem}>
                            <span style={styles.boardMiniName}>{c.name}</span>
                            <span style={styles.boardOvertimeTime}>
                              {getWaitMinutes(c.waitStartAt || c.arrivalTime)}分钟
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={styles.boardWaitingSection}>
                    <div style={styles.boardSectionLabel}>📋 候诊队列 ({waitingList.length})</div>
                    {waitingList.length > 0 ? (
                      <div style={styles.boardQueueList}>
                        {waitingList.map((c, idx) => (
                          <div
                            key={c.id}
                            style={styles.boardQueueItem}
                            onClick={() => { selectCustomer(c.id); setActivePanel('detail') }}
                          >
                            <span style={styles.boardQueueOrder}>{idx + 1}</span>
                            <span style={styles.boardQueueName}>{c.name}</span>
                            <span style={{
                              ...styles.boardQueueType,
                              background: getCustomerTypeColor(c.type),
                            }}>
                              {getCustomerTypeLabel(c.type)}
                            </span>
                            <span style={styles.boardQueueWait}>
                              {getWaitMinutes(c.waitStartAt || c.arrivalTime)}分
                            </span>
                            {idx === 0 && c.status === 'waiting' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); callCustomer(c.id) }}
                                style={styles.callBtnMini}
                              >
                                叫号
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.boardEmptyMini}>无</div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      ) : (
        <>
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
              const waitingCount = zoneCustomers.filter((c) => c.status === 'waiting' || c.status === 'called').length
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
                      <span style={{ ...styles.zoneBadge, background: getZoneColor(zone.key) }}>
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
                          <span style={{ ...styles.zoneStaffDot, background: getStaffStatusColor(s.status) }} />
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
                            onClick={() => { selectCustomer(c.id); setActivePanel('detail') }}
                            style={{
                              ...styles.customerItem,
                              borderLeft: `3px solid ${getCustomerTypeColor(c.type)}`,
                            }}
                          >
                            <div style={styles.customerInfo}>
                              <div style={styles.customerTop}>
                                <span style={styles.customerName}>{c.name}</span>
                                <span style={{ ...styles.customerType, background: getCustomerTypeColor(c.type) }}>
                                  {getCustomerTypeLabel(c.type)}
                                </span>
                              </div>
                              <div style={styles.customerSub}>
                                {formatTime(c.arrivalTime)} · 等待{waitMinutes}分钟
                              </div>
                            </div>
                            <span style={{
                              ...styles.customerStatus,
                              background: `${getCustomerStatusColor(c.status)}20`,
                              color: getCustomerStatusColor(c.status),
                            }}>
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
        </>
      )}
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
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  viewToggle: {
    display: 'flex',
    gap: '2px',
    background: 'var(--bg-secondary)',
    padding: '3px',
    borderRadius: '8px',
  },
  viewBtn: {
    padding: '7px 14px',
    fontSize: '13px',
    borderRadius: '6px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  viewBtnActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  floorTabs: {
    display: 'flex',
    gap: '4px',
    background: 'var(--bg-secondary)',
    padding: '3px',
    borderRadius: '8px',
  },
  floorTab: {
    padding: '7px 14px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    borderRadius: '6px',
  },
  floorTabActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  boardGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    overflowY: 'auto',
    alignContent: 'start',
  },
  boardCard: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  boardCardHeader: {
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  boardZoneInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  boardZoneBadge: {
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
  boardZoneTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  boardZoneFloor: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  boardStats: {
    display: 'flex',
    gap: '12px',
  },
  boardStat: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  boardNextSection: {
    padding: '12px 16px',
    background: 'var(--bg-primary)',
    margin: '0 12px',
    borderRadius: '10px',
  },
  boardSectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  boardNextCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boardNextLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  boardQueueNum: {
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 700,
    color: 'white',
  },
  boardNextName: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  boardNextSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  callBtn: {
    padding: '10px 20px',
    background: '#f59e0b',
    color: 'white',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
  },
  calledBadge: {
    padding: '8px 16px',
    background: '#f59e0b20',
    color: '#f59e0b',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
  },
  boardEmpty: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '8px',
  },
  boardCalledSection: {
    padding: '10px 16px',
  },
  boardActiveSection: {
    padding: '10px 16px',
  },
  boardOvertimeSection: {
    padding: '10px 16px',
    background: '#ef444410',
    margin: '0 12px',
    borderRadius: '8px',
  },
  boardWaitingSection: {
    padding: '10px 16px 14px',
    flex: 1,
    overflowY: 'auto',
  },
  boardMiniList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  boardMiniItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: 'var(--bg-primary)',
    borderRadius: '6px',
  },
  boardMiniName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  boardMiniNum: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'white',
  },
  boardActiveItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: 'var(--bg-primary)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  boardMiniStatus: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  boardEmptyMini: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    padding: '4px',
  },
  boardOvertimeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '6px',
  },
  boardOvertimeTime: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#ef4444',
  },
  boardQueueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  boardQueueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    background: 'var(--bg-primary)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  boardQueueOrder: {
    width: '20px',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  boardQueueName: {
    flex: 1,
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  boardQueueType: {
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 600,
    color: 'white',
  },
  boardQueueWait: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  callBtnMini: {
    padding: '3px 8px',
    background: '#f59e0b',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
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
  staffSectionIcon: { fontSize: '18px' },
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
  staffInfo: { flex: 1 },
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
  customerInfo: { flex: 1 },
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
