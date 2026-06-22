import { useState, useEffect } from 'react'
import type { ExceptionEvent } from '../types'
import { useTriageStore } from '../store/triageStore'
import { formatDateTime } from '../utils/format'

const typeLabels: Record<ExceptionEvent['type'], string> = {
  timeout: '⏰ 超时提醒',
  wrong_floor: '🏢 走错楼层',
  duplicate_checkin: '🔄 重复签到',
  temporary_leave: '⏸ 临时离开',
  no_show: '❓ 未到店',
}

const typeColors: Record<ExceptionEvent['type'], string> = {
  timeout: '#ef4444',
  wrong_floor: '#f59e0b',
  duplicate_checkin: '#8b5cf6',
  temporary_leave: '#f59e0b',
  no_show: '#64748b',
}

type FilterType = 'all' | ExceptionEvent['type'] | 'resolved' | 'active'

export default function ExceptionPanel() {
  const exceptions = useTriageStore((s) => s.exceptions)
  const selectCustomer = useTriageStore((s) => s.selectCustomer)
  const selectException = useTriageStore((s) => s.selectException)
  const setActivePanel = useTriageStore((s) => s.setActivePanel)
  const resolveException = useTriageStore((s) => s.resolveException)
  const addException = useTriageStore((s) => s.addException)
  const addCustomer = useTriageStore((s) => s.addCustomer)
  const customers = useTriageStore((s) => s.customers)
  const getExceptionById = useTriageStore((s) => s.getExceptionById)

  const [filter, setFilter] = useState<FilterType>('all')
  const storeFilter = useTriageStore((s) => s.exceptionFilter)
  const [resolveInput, setResolveInput] = useState<Record<string, string>>({})
  const [showQuickReport, setShowQuickReport] = useState(false)
  const [showDupModal, setShowDupModal] = useState(false)

  const [dupName, setDupName] = useState('')
  const [dupPhone, setDupPhone] = useState('')
  const [dupDetails, setDupDetails] = useState('')
  const [dupError, setDupError] = useState('')
  const [dupMatched, setDupMatched] = useState<any>(null)

  useEffect(() => {
    if (storeFilter) {
      setFilter(storeFilter as FilterType)
      useTriageStore.setState({ exceptionFilter: null })
    }
  }, [storeFilter])

  const filtered = exceptions.filter((e) => {
    if (filter === 'all') return true
    if (filter === 'active') return !e.resolved
    if (filter === 'resolved') return e.resolved
    return e.type === filter
  }).sort((a, b) => {
    if (a.resolved && b.resolved) {
      const timeA = a.resolvedAt ? new Date(a.resolvedAt).getTime() : 0
      const timeB = b.resolvedAt ? new Date(b.resolvedAt).getTime() : 0
      return timeB - timeA
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const activeCount = exceptions.filter((e) => !e.resolved).length
  const timeoutCount = exceptions.filter((e) => e.type === 'timeout' && !e.resolved).length
  const leaveCount = exceptions.filter((e) => e.type === 'temporary_leave' && !e.resolved).length

  const handleResolve = (id: string) => {
    resolveException(id, resolveInput[id] || '已处理')
    setResolveInput((prev) => ({ ...prev, [id]: '' }))
  }

  const goToCustomer = (customerId: string, exceptionId?: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      selectCustomer(customerId)
      if (exceptionId) {
        useTriageStore.setState({ selectedExceptionId: exceptionId })
      }
    } else if (exceptionId) {
      selectException(exceptionId)
    }
    setActivePanel('detail')
  }

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: exceptions.length },
    { key: 'active', label: '待处理', count: activeCount },
    { key: 'timeout', label: '超时', count: timeoutCount },
    { key: 'temporary_leave', label: '临时离开', count: leaveCount },
    { key: 'wrong_floor', label: '走错楼层', count: exceptions.filter((e) => e.type === 'wrong_floor' && !e.resolved).length },
    { key: 'duplicate_checkin', label: '重复签到', count: exceptions.filter((e) => e.type === 'duplicate_checkin' && !e.resolved).length },
    { key: 'resolved', label: '已处理', count: exceptions.filter((e) => e.resolved).length },
  ]

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>异常事件处理</h2>
          {activeCount > 0 && (
            <span style={styles.alertBadge}>
              {activeCount} 项待处理
            </span>
          )}
        </div>
        <button
          style={styles.reportBtn}
          onClick={() => setShowQuickReport(!showQuickReport)}
        >
          ⚡ 快速上报
        </button>
      </div>

      {showQuickReport && (
        <div style={styles.quickReport}>
          <div style={styles.quickReportTitle}>快速上报异常事件</div>
          <div style={styles.quickReportGrid}>
            <button
              style={styles.quickReportBtn}
              onClick={() => {
                const waiting = customers.find((c) => c.status === 'waiting')
                if (waiting) {
                  addException({
                    type: 'timeout',
                    customerId: waiting.id,
                    customerName: waiting.name,
                    details: '候诊超时，请尽快安排',
                  })
                }
                setShowQuickReport(false)
              }}
            >
              ⏰ 候诊超时
            </button>
            <button
              style={styles.quickReportBtn}
              onClick={() => {
                const waiting = customers.find((c) => c.status === 'waiting')
                if (waiting) {
                  addException({
                    type: 'wrong_floor',
                    customerId: waiting.id,
                    customerName: waiting.name,
                    details: '顾客走错楼层，请引导',
                  })
                }
                setShowQuickReport(false)
              }}
            >
              🏢 走错楼层
            </button>
            <button
              style={styles.quickReportBtn}
              onClick={() => {
                setShowQuickReport(false)
                setShowDupModal(true)
                setDupName('')
                setDupPhone('')
                setDupDetails('')
                setDupError('')
                setDupMatched(null)
              }}
            >
              🔄 重复签到
            </button>
            <button
              style={styles.quickReportBtn}
              onClick={() => {
                const waiting = customers.find((c) => c.status === 'waiting')
                if (waiting) {
                  addException({
                    type: 'no_show',
                    customerId: waiting.id,
                    customerName: waiting.name,
                    details: '顾客预约后未到店',
                  })
                }
                setShowQuickReport(false)
              }}
            >
              ❓ 未到店
            </button>
          </div>
        </div>
      )}

      <div style={styles.statsRow}>
        {filterOptions.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              ...styles.filterChip,
              ...(filter === f.key ? styles.filterChipActive : {}),
            }}
          >
            {f.label}
            {f.count > 0 && <span style={styles.filterChipCount}>{f.count}</span>}
          </button>
        ))}
      </div>

      <div style={styles.list}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>✅</div>
            <div style={styles.emptyText}>暂无异常事件</div>
            <div style={styles.emptyHint}>现场秩序良好，请继续保持</div>
          </div>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              style={{
                ...styles.eventCard,
                ...(e.resolved ? styles.eventCardResolved : {}),
                borderLeft: `4px solid ${typeColors[e.type]}`,
              }}
            >
              <div style={styles.eventHeader}>
                <div style={styles.eventLeft}>
                  <span
                    style={{
                      ...styles.eventType,
                      background: `${typeColors[e.type]}20`,
                      color: typeColors[e.type],
                    }}
                  >
                    {typeLabels[e.type]}
                  </span>
                  <span
                    onClick={() => goToCustomer(e.customerId, e.id)}
                    style={styles.eventCustomer}
                  >
                    👤 {e.customerName}
                  </span>
                </div>
                <div style={styles.eventRight}>
                  <span style={styles.eventTime}>
                    {formatDateTime(e.createdAt)}
                  </span>
                  {e.resolved ? (
                    <span style={styles.resolvedBadge}>
                      ✓ 已处理 · {formatDateTime(e.resolvedAt)}
                    </span>
                  ) : (
                    <span style={styles.pendingBadge}>待处理</span>
                  )}
                </div>
              </div>

              <div style={styles.eventDetails}>
                <div style={styles.eventDetailText}>📝 {e.details}</div>
                {e.notes && (
                  <div style={styles.eventNotes}>💬 处理备注: {e.notes}</div>
                )}
              </div>

              {!e.resolved && (
                <div style={styles.eventActions}>
                  <input
                    style={styles.resolveInput}
                    placeholder="输入处理备注（选填）"
                    value={resolveInput[e.id] || ''}
                    onChange={(ev) =>
                      setResolveInput((prev) => ({ ...prev, [e.id]: ev.target.value }))
                    }
                  />
                  <button
                    style={styles.customerBtn}
                    onClick={() => goToCustomer(e.customerId, e.id)}
                  >
                    查看顾客详情
                  </button>
                  <button
                    style={styles.resolveBtn}
                    onClick={() => handleResolve(e.id)}
                  >
                    ✓ 标记已处理
                  </button>

                  {e.type === 'timeout' && (
                    <button
                      style={styles.actionBtnAlt}
                      onClick={() => {
                        goToCustomer(e.customerId)
                        handleResolve(e.id)
                      }}
                    >
                      立即安排接诊
                    </button>
                  )}
                  {e.type === 'wrong_floor' && (
                    <button
                      style={styles.actionBtnAlt}
                      onClick={() => handleResolve(e.id)}
                    >
                      已引导至正确楼层
                    </button>
                  )}
                  {e.type === 'temporary_leave' && (
                    <button
                      style={styles.actionBtnAlt}
                      onClick={() => handleResolve(e.id)}
                    >
                      顾客已返回
                    </button>
                  )}
                  {e.type === 'duplicate_checkin' && (
                    <button
                      style={styles.actionBtnAlt}
                      onClick={() => handleResolve(e.id)}
                    >
                      已确认处理
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.tipsSection}>
        <div style={styles.tipsTitle}>📋 异常处理规范</div>
        <div style={styles.tipsGrid}>
          <div style={styles.tipCard}>
            <div style={styles.tipIcon}>⏰</div>
            <div>
              <div style={styles.tipName}>候诊超时</div>
              <div style={styles.tipDesc}>等待超过30分钟需主动沟通，协调资源优先安排</div>
            </div>
          </div>
          <div style={styles.tipCard}>
            <div style={styles.tipIcon}>🏢</div>
            <div>
              <div style={styles.tipName}>走错楼层</div>
              <div style={styles.tipDesc}>第一时间安排护士引导，避免顾客困惑</div>
            </div>
          </div>
          <div style={styles.tipCard}>
            <div style={styles.tipIcon}>🔄</div>
            <div>
              <div style={styles.tipName}>重复签到</div>
              <div style={styles.tipDesc}>核实身份后更新签到状态，避免重复排队</div>
            </div>
          </div>
          <div style={styles.tipCard}>
            <div style={styles.tipIcon}>⏸</div>
            <div>
              <div style={styles.tipName}>临时离开</div>
              <div style={styles.tipDesc}>超过15分钟未返回需电话联系确认</div>
            </div>
          </div>
        </div>
      </div>

      {showDupModal && (
        <div style={dupStyles.overlay} onClick={() => setShowDupModal(false)}>
          <div style={dupStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={dupStyles.header}>
              <h3 style={dupStyles.title}>🔄 上报重复签到</h3>
              <button onClick={() => setShowDupModal(false)} style={dupStyles.closeBtn}>✕</button>
            </div>

            <div style={dupStyles.body}>
              {dupError && <div style={dupStyles.errorBox}>⚠️ {dupError}</div>}

              <div style={dupStyles.formGroup}>
                <label style={dupStyles.label}>顾客姓名 *</label>
                <input
                  style={dupStyles.input}
                  placeholder="请输入顾客姓名"
                  value={dupName}
                  onChange={(e) => {
                    setDupName(e.target.value)
                    setDupError('')
                    const m = customers.find((c) => c.name === e.target.value.trim())
                    setDupMatched(m || null)
                  }}
                />
              </div>

              <div style={dupStyles.formGroup}>
                <label style={dupStyles.label}>联系电话 *</label>
                <input
                  style={dupStyles.input}
                  placeholder="请输入手机号用于匹配"
                  value={dupPhone}
                  maxLength={11}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    setDupPhone(v)
                    setDupError('')
                    if (v.length >= 7) {
                      const m = customers.find((c) => c.phone.includes(v))
                      setDupMatched(m || null)
                    } else {
                      setDupMatched(null)
                    }
                  }}
                />
              </div>

              {dupMatched && (
                <div style={dupStyles.matchBox}>
                  <div style={dupStyles.matchTitle}>✅ 系统匹配到已签到顾客：</div>
                  <div style={dupStyles.matchRow}>
                    <span style={dupStyles.matchName}>{dupMatched.name}</span>
                    <span style={dupStyles.matchPhone}>{dupMatched.phone}</span>
                    <span style={{
                      ...dupStyles.matchBadge,
                      background: dupMatched.status === 'waiting' ? '#6366f130' : '#10b98130',
                      color: dupMatched.status === 'waiting' ? '#6366f1' : '#10b981',
                    }}>
                      {dupMatched.status === 'waiting' ? '候诊中' : '服务中'}
                    </span>
                  </div>
                  <div style={dupStyles.matchSub}>
                    到店时间：{new Date(dupMatched.arrivalTime).toLocaleTimeString('zh-CN', {hour12: false})}
                    {' · '}候诊区：{dupMatched.zone}区{dupMatched.floor}楼
                    {' · '}队列号：{dupMatched.queueOrder}
                  </div>
                </div>
              )}

              <div style={dupStyles.formGroup}>
                <label style={dupStyles.label}>异常详情备注</label>
                <textarea
                  style={dupStyles.textarea}
                  placeholder="例如：顾客刚刚在1楼签过到，又到2楼护士站重复签到，顾客姓名正确"
                  rows={3}
                  value={dupDetails}
                  onChange={(e) => setDupDetails(e.target.value)}
                />
              </div>

              <div style={dupStyles.hintBox}>
                💡 上报后将在「待处理」列表生成异常，其他岗位可同步看到，并可备注处理、标记已解决
              </div>
            </div>

            <div style={dupStyles.footer}>
              <button style={dupStyles.cancelBtn} onClick={() => setShowDupModal(false)}>
                取消
              </button>
              <button
                style={dupStyles.submitBtn}
                onClick={() => {
                  if (!dupName.trim()) { setDupError('请输入顾客姓名'); return }
                  if (!dupPhone.trim() || dupPhone.length < 7) { setDupError('请输入有效的联系电话'); return }

                  let targetCustomer = dupMatched
                  let targetName = dupName.trim()
                  let targetId = ''

                  if (targetCustomer) {
                    targetId = targetCustomer.id
                    targetName = targetCustomer.name
                  } else {
                    targetId = 'temp_' + Date.now()
                  }

                  addException({
                    type: 'duplicate_checkin',
                    customerId: targetId,
                    customerName: targetName,
                    customerPhone: dupPhone,
                    details: dupDetails.trim() || '顾客疑似重复签到，请核实处理',
                    notes: '联系方式：' + dupPhone,
                  })
                  setShowDupModal(false)
                }}
              >
                ✅ 确认上报异常
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const dupStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    width: '520px',
    background: 'var(--bg-secondary)',
    borderRadius: '16px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid var(--border-color)',
  },
  title: { fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
    fontSize: '16px',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  errorBox: {
    padding: '10px 14px',
    background: '#ef444420',
    border: '1px solid #ef444450',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#ef4444',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' },
  input: {
    padding: '11px 14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  textarea: {
    padding: '11px 14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    resize: 'none',
    fontFamily: 'inherit',
  },
  matchBox: {
    padding: '14px',
    background: '#10b98115',
    border: '1px solid #10b98140',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  matchTitle: { fontSize: '13px', color: '#10b981', fontWeight: 600 },
  matchRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  matchName: { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' },
  matchPhone: { fontSize: '13px', color: 'var(--text-muted)' },
  matchBadge: { padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 },
  matchSub: { fontSize: '12px', color: 'var(--text-muted)' },
  hintBox: {
    padding: '10px 14px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid var(--border-color)',
  },
  cancelBtn: {
    padding: '10px 22px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    borderRadius: '8px',
    fontSize: '14px',
  },
  submitBtn: {
    padding: '10px 26px',
    background: 'var(--accent-primary)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
  },
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  alertBadge: {
    padding: '4px 12px',
    background: 'var(--accent-primary)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    animation: 'pulse 2s infinite',
  },
  reportBtn: {
    padding: '10px 18px',
    background: 'var(--accent-warning)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
  },
  quickReport: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '16px',
  },
  quickReportTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  },
  quickReportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  },
  quickReportBtn: {
    padding: '14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  statsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  filterChipActive: {
    background: 'var(--accent-primary)',
    color: 'white',
  },
  filterChipCount: {
    padding: '1px 8px',
    background: 'var(--bg-tertiary)',
    borderRadius: '10px',
    fontSize: '11px',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '56px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  emptyHint: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  eventCard: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  eventCardResolved: {
    opacity: 0.7,
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  eventType: {
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
  },
  eventCustomer: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--accent-secondary)',
    cursor: 'pointer',
  },
  eventRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  eventTime: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  pendingBadge: {
    padding: '4px 10px',
    background: 'var(--accent-primary)20',
    color: 'var(--accent-primary)',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  resolvedBadge: {
    padding: '4px 10px',
    background: 'var(--accent-success)20',
    color: 'var(--accent-success)',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  eventDetailText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  eventNotes: {
    fontSize: '13px',
    color: 'var(--accent-success)',
    padding: '8px 12px',
    background: 'var(--accent-success)10',
    borderRadius: '6px',
  },
  eventActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-color)',
  },
  resolveInput: {
    flex: 1,
    minWidth: '180px',
    padding: '10px 14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  customerBtn: {
    padding: '10px 16px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
  },
  resolveBtn: {
    padding: '10px 20px',
    background: 'var(--accent-success)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
  },
  actionBtnAlt: {
    padding: '10px 16px',
    background: 'var(--accent-secondary)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
  },
  tipsSection: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '16px',
  },
  tipsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  },
  tipCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
  },
  tipIcon: {
    fontSize: '20px',
  },
  tipName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  tipDesc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
}
