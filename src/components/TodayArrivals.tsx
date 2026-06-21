import { useState } from 'react'
import type { Customer, CustomerStatus } from '../types'
import { useTriageStore } from '../store/triageStore'
import {
  formatTime,
  getWaitMinutes,
  getCustomerTypeLabel,
  getCustomerTypeColor,
  getCustomerStatusLabel,
  getCustomerStatusColor,
  getZoneColor,
  generateQueueNumber,
} from '../utils/format'

type FilterKey = 'all' | 'waiting' | 'active' | 'completed'

export default function TodayArrivals() {
  const customers = useTriageStore((s) => s.customers)
  const selectedCustomerId = useTriageStore((s) => s.selectedCustomerId)
  const selectCustomer = useTriageStore((s) => s.selectCustomer)
  const setActivePanel = useTriageStore((s) => s.setActivePanel)
  const updateCustomerStatus = useTriageStore((s) => s.updateCustomerStatus)
  const markSkinTestDone = useTriageStore((s) => s.markSkinTestDone)
  const markPhotoDone = useTriageStore((s) => s.markPhotoDone)
  const markTemporaryLeave = useTriageStore((s) => s.markTemporaryLeave)
  const reorderCustomers = useTriageStore((s) => s.reorderCustomers)
  const getStaffById = useTriageStore((s) => s.getStaffById)

  const [filter, setFilter] = useState<FilterKey>('all')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const filteredCustomers = customers
    .filter((c) => {
      if (filter === 'all') return true
      if (filter === 'waiting') return c.status === 'waiting' || c.status === 'temporary_leave'
      if (filter === 'active')
        return ['skin_test', 'photo_room', 'consultation', 'injection_consult', 'treatment'].includes(
          c.status
        )
      if (filter === 'completed') return c.status === 'completed' || c.status === 'cancelled'
      return true
    })
    .sort((a, b) => a.queueOrder - b.queueOrder)

  const handlePrint = (c: Customer) => {
    const consultant = getStaffById(c.consultantId || '')
    const doctor = getStaffById(c.doctorId || '')
    const ticket = `
====================================
         医美导诊小票
====================================
号：${generateQueueNumber(c.type, c.queueOrder)}
姓名：${c.name}
类型：${getCustomerTypeLabel(c.type)}
电话：${c.phone}
到店时间：${formatTime(c.arrivalTime)}
候诊区：${c.zone}区 ${c.floor}楼
项目意向：${c.intent.join('、') || '-'}
咨询师：${consultant?.name || '-'}
医生：${doctor?.name || '-'}
====================================
当前状态：${getCustomerStatusLabel(c.status)}
皮肤检测：${c.hasSkinTest ? '已完成' : '未完成'}
拍照：${c.hasPhoto ? '已完成' : '未完成'}
====================================
        请在候诊区耐心等候
====================================
    `
    const w = window.open('', '', 'width=300,height=500')
    if (w) {
      w.document.write(`<pre style="font-size:12px;line-height:1.6">${ticket}</pre>`)
      w.document.close()
      setTimeout(() => w.print(), 300)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderCustomers(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const quickActions: { label: string; status?: CustomerStatus; action?: (c: Customer) => void; color: string }[] = [
    { label: '皮肤检测完成', action: (c) => markSkinTestDone(c.id), color: 'var(--accent-info)' },
    { label: '带去拍照室', status: 'photo_room', action: (c) => { markPhotoDone(c.id); updateCustomerStatus(c.id, 'photo_room') }, color: 'var(--accent-purple)' },
    { label: '带去面诊室', status: 'consultation', color: 'var(--accent-success)' },
    { label: '转注射咨询', status: 'injection_consult', color: 'var(--accent-warning)' },
    { label: '临时离开', action: (c) => markTemporaryLeave(c.id), color: 'var(--text-muted)' },
    { label: '完成接待', status: 'completed', color: '#64748b' },
  ]

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h2 style={styles.title}>今日到诊队列</h2>
          <div style={styles.filters}>
            {(['all', 'waiting', 'active', 'completed'] as FilterKey[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterBtn,
                  ...(filter === f ? styles.filterBtnActive : {}),
                }}
              >
                {f === 'all' ? '全部' : f === 'waiting' ? '候诊中' : f === 'active' ? '进行中' : '已完成'}
                <span style={styles.filterCount}>
                  {f === 'all'
                    ? customers.length
                    : f === 'waiting'
                    ? customers.filter((c) => c.status === 'waiting' || c.status === 'temporary_leave').length
                    : f === 'active'
                    ? customers.filter((c) =>
                        ['skin_test', 'photo_room', 'consultation', 'injection_consult', 'treatment'].includes(
                          c.status
                        )
                      ).length
                    : customers.filter((c) => c.status === 'completed' || c.status === 'cancelled').length}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: 'var(--type-first)' }} />初诊
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: 'var(--type-revisit)' }} />复诊
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: 'var(--type-companion)' }} />陪同
          </div>
          <div style={styles.legendDivider} />
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: 'var(--zone-a)' }} />A区
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: 'var(--zone-b)' }} />B区
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: 'var(--zone-c)' }} />C区
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: 'var(--zone-d)' }} />D区
          </div>
        </div>
      </div>

      <div style={styles.queueHeader}>
        <div style={{ ...styles.queueCell, width: '60px' }}>序号</div>
        <div style={{ ...styles.queueCell, width: '80px' }}>号码</div>
        <div style={{ ...styles.queueCell, width: '100px' }}>类型</div>
        <div style={{ ...styles.queueCell, flex: 1.2 }}>顾客信息</div>
        <div style={{ ...styles.queueCell, flex: 1 }}>项目意向</div>
        <div style={{ ...styles.queueCell, width: '120px' }}>候诊区</div>
        <div style={{ ...styles.queueCell, width: '120px' }}>到店时间</div>
        <div style={{ ...styles.queueCell, width: '100px' }}>等待时长</div>
        <div style={{ ...styles.queueCell, width: '140px' }}>当前状态</div>
        <div style={{ ...styles.queueCell, flex: 2 }}>快速操作</div>
      </div>

      <div style={styles.queueList}>
        {filteredCustomers.map((c, index) => {
          const waitMinutes = getWaitMinutes(c.waitStartAt || c.arrivalTime)
          const isOver30 = waitMinutes > 30 && c.status === 'waiting'
          const consultant = getStaffById(c.consultantId || '')
          const isSelected = selectedCustomerId === c.id
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index && draggedIndex !== index

          return (
            <div
              key={c.id}
              draggable={c.status !== 'completed' && c.status !== 'cancelled'}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                selectCustomer(c.id)
                setActivePanel('detail')
              }}
              style={{
                ...styles.queueRow,
                ...(isSelected ? styles.queueRowSelected : {}),
                ...(isDragging ? { opacity: 0.4 } : {}),
                ...(isDragOver ? { background: 'rgba(239, 68, 68, 0.2)' } : {}),
                borderLeft: `4px solid ${getCustomerTypeColor(c.type)}`,
              }}
            >
              <div style={{ ...styles.queueCell, width: '60px' }}>
                <span style={styles.orderNum}>{c.queueOrder}</span>
              </div>
              <div style={{ ...styles.queueCell, width: '80px' }}>
                <span
                  style={{
                    ...styles.queueNumber,
                    background: getZoneColor(c.zone),
                  }}
                >
                  {generateQueueNumber(c.type, c.queueOrder)}
                </span>
              </div>
              <div style={{ ...styles.queueCell, width: '100px' }}>
                <span
                  style={{
                    ...styles.typeBadge,
                    background: getCustomerTypeColor(c.type),
                  }}
                >
                  {getCustomerTypeLabel(c.type)}
                  {c.isTemporary && ' · 临时'}
                </span>
              </div>
              <div style={{ ...styles.queueCell, flex: 1.2 }}>
                <div style={styles.customerName}>{c.name}</div>
                <div style={styles.customerPhone}>{c.phone}</div>
                {consultant && <div style={styles.staffMini}>咨询师: {consultant.name}</div>}
              </div>
              <div style={{ ...styles.queueCell, flex: 1 }}>
                <div style={styles.intentList}>
                  {c.intent.slice(0, 2).map((i, idx) => (
                    <span key={idx} style={styles.intentTag}>
                      {i}
                    </span>
                  ))}
                  {c.intent.length > 2 && (
                    <span style={styles.intentMore}>+{c.intent.length - 2}</span>
                  )}
                </div>
              </div>
              <div style={{ ...styles.queueCell, width: '120px' }}>
                <span
                  style={{
                    ...styles.zoneBadge,
                    background: `${getZoneColor(c.zone)}20`,
                    color: getZoneColor(c.zone),
                    border: `1px solid ${getZoneColor(c.zone)}40`,
                  }}
                >
                  {c.floor}F · {c.zone}区
                </span>
              </div>
              <div style={{ ...styles.queueCell, width: '120px' }}>
                <span style={styles.timeText}>{formatTime(c.arrivalTime)}</span>
              </div>
              <div style={{ ...styles.queueCell, width: '100px' }}>
                <span
                  style={{
                    ...styles.waitTime,
                    color: isOver30 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {waitMinutes >= 60
                    ? `${Math.floor(waitMinutes / 60)}时${waitMinutes % 60}分`
                    : `${waitMinutes}分钟`}
                  {isOver30 && ' ⚠'}
                </span>
              </div>
              <div style={{ ...styles.queueCell, width: '140px' }}>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: `${getCustomerStatusColor(c.status)}20`,
                    color: getCustomerStatusColor(c.status),
                    border: `1px solid ${getCustomerStatusColor(c.status)}40`,
                  }}
                >
                  {getCustomerStatusLabel(c.status)}
                </span>
              </div>
              <div
                style={{ ...styles.queueCell, flex: 2, gap: '6px' }}
                onClick={(e) => e.stopPropagation()}
              >
                {c.status !== 'completed' && c.status !== 'cancelled' && (
                  <>
                    {quickActions.slice(0, 4).map((a, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (a.status) updateCustomerStatus(c.id, a.status)
                          if (a.action) a.action(c)
                        }}
                        style={{
                          ...styles.actionBtn,
                          background: a.color + '20',
                          color: a.color,
                          border: `1px solid ${a.color}40`,
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                    <div style={styles.actionMore}>
                      <button style={styles.actionMoreBtn}>⋯</button>
                      <div style={styles.actionMoreMenu}>
                        {quickActions.slice(4).map((a, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (a.status) updateCustomerStatus(c.id, a.status)
                              if (a.action) a.action(c)
                            }}
                            style={styles.actionMoreItem}
                          >
                            {a.label}
                          </button>
                        ))}
                        <button onClick={() => handlePrint(c)} style={styles.actionMoreItem}>
                          🖨 打印导诊小票
                        </button>
                      </div>
                    </div>
                  </>
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
    gap: '12px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  filters: {
    display: 'flex',
    gap: '8px',
    background: 'var(--bg-secondary)',
    padding: '4px',
    borderRadius: '8px',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  filterCount: {
    padding: '2px 8px',
    background: 'var(--bg-tertiary)',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '10px 16px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendDivider: {
    width: '1px',
    height: '16px',
    background: 'var(--border-color)',
    margin: '0 4px',
  },
  queueHeader: {
    display: 'flex',
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  queueCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    gap: '6px',
    flexWrap: 'wrap',
  },
  queueList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  queueRow: {
    display: 'flex',
    padding: '14px 16px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    alignItems: 'center',
  },
  queueRowSelected: {
    background: 'var(--bg-tertiary)',
    boxShadow: '0 0 0 1px var(--accent-primary)',
  },
  orderNum: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  queueNumber: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 700,
    color: 'white',
    fontVariantNumeric: 'tabular-nums',
  },
  typeBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'white',
  },
  customerName: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  customerPhone: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  staffMini: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  intentList: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  intentTag: {
    padding: '3px 8px',
    background: 'var(--bg-tertiary)',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  intentMore: {
    padding: '3px 6px',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  zoneBadge: {
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  timeText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontVariantNumeric: 'tabular-nums',
  },
  waitTime: {
    fontSize: '14px',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  statusBadge: {
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  actionBtn: {
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  actionMore: {
    position: 'relative',
  },
  actionMoreBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    fontSize: '16px',
    lineHeight: 1,
  },
  actionMoreMenu: {
    display: 'none',
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: '4px',
    background: 'var(--bg-tertiary)',
    borderRadius: '8px',
    padding: '6px',
    minWidth: '160px',
    zIndex: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
  actionMoreItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    borderRadius: '6px',
  },
}
