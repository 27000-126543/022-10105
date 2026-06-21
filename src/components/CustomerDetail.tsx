import { useState } from 'react'
import type { CustomerStatus, CustomerType, WaitingZone } from '../types'
import { useTriageStore } from '../store/triageStore'
import {
  formatTime,
  formatDateTime,
  getWaitMinutes,
  getCustomerTypeLabel,
  getCustomerTypeColor,
  getCustomerStatusLabel,
  getCustomerStatusColor,
  getZoneColor,
  generateQueueNumber,
} from '../utils/format'

export default function CustomerDetail() {
  const selectedCustomerId = useTriageStore((s) => s.selectedCustomerId)
  const customers = useTriageStore((s) => s.customers)
  const staff = useTriageStore((s) => s.staff)
  const rooms = useTriageStore((s) => s.rooms)
  const selectCustomer = useTriageStore((s) => s.selectCustomer)
  const updateCustomer = useTriageStore((s) => s.updateCustomer)
  const updateCustomerStatus = useTriageStore((s) => s.updateCustomerStatus)
  const markSkinTestDone = useTriageStore((s) => s.markSkinTestDone)
  const markPhotoDone = useTriageStore((s) => s.markPhotoDone)
  const markTemporaryLeave = useTriageStore((s) => s.markTemporaryLeave)
  const returnFromLeave = useTriageStore((s) => s.returnFromLeave)
  const assignConsultant = useTriageStore((s) => s.assignConsultant)
  const assignDoctor = useTriageStore((s) => s.assignDoctor)
  const setCustomerZone = useTriageStore((s) => s.setCustomerZone)
  const getStaffById = useTriageStore((s) => s.getStaffById)
  const getRoomById = useTriageStore((s) => s.getRoomById)

  const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info')

  const customer = customers.find((c) => c.id === selectedCustomerId)

  if (!customer) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>👤</div>
        <div style={styles.emptyText}>请在左侧队列中选择顾客</div>
        <div style={styles.emptyHint}>
          共 {customers.filter((c) => c.status !== 'completed' && c.status !== 'cancelled').length} 位顾客待服务
        </div>
        <div style={styles.quickList}>
          {customers
            .filter((c) => c.status === 'waiting')
            .slice(0, 6)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c.id)}
                style={{
                  ...styles.quickItem,
                  borderLeft: `3px solid ${getCustomerTypeColor(c.type)}`,
                }}
              >
                <span style={styles.quickName}>{c.name}</span>
                <span style={styles.quickType}>{getCustomerTypeLabel(c.type)}</span>
              </button>
            ))}
        </div>
      </div>
    )
  }

  const consultant = getStaffById(customer.consultantId || '')
  const doctor = getStaffById(customer.doctorId || '')
  const room = getRoomById(customer.roomId || '')
  const waitMinutes = getWaitMinutes(customer.waitStartAt || customer.arrivalTime)

  const statuses: CustomerStatus[] = [
    'waiting',
    'skin_test',
    'photo_room',
    'consultation',
    'injection_consult',
    'treatment',
    'temporary_leave',
    'completed',
  ]

  const zones: WaitingZone[] = ['A', 'B', 'C', 'D']
  const floors = [1, 2, 3]
  const types: CustomerType[] = ['first_visit', 'revisit', 'companion']

  const availableConsultants = staff.filter((s) => s.role === 'consultant')
  const availableDoctors = staff.filter((s) => s.role === 'doctor')

  const handlePrint = () => {
    const ticket = `
====================================
         医美导诊小票
====================================
号：${generateQueueNumber(customer.type, customer.queueOrder)}
姓名：${customer.name}
类型：${getCustomerTypeLabel(customer.type)}
电话：${customer.phone}
到店时间：${formatTime(customer.arrivalTime)}
候诊区：${customer.zone}区 ${customer.floor}楼
项目意向：${customer.intent.join('、') || '-'}
咨询师：${consultant?.name || '-'}
医生：${doctor?.name || '-'}
====================================
当前状态：${getCustomerStatusLabel(customer.status)}
皮肤检测：${customer.hasSkinTest ? '已完成' : '未完成'}
拍照：${customer.hasPhoto ? '已完成' : '未完成'}
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div
            style={{
              ...styles.avatar,
              background: `linear-gradient(135deg, ${getCustomerTypeColor(customer.type)}, #8b5cf6)`,
            }}
          >
            {customer.name.slice(-1)}
          </div>
          <div>
            <div style={styles.nameRow}>
              <h2 style={styles.name}>{customer.name}</h2>
              <span
                style={{
                  ...styles.typeBadge,
                  background: getCustomerTypeColor(customer.type),
                }}
              >
                {getCustomerTypeLabel(customer.type)}
              </span>
              {customer.isTemporary && (
                <span style={styles.tempBadge}>临时到店</span>
              )}
            </div>
            <div style={styles.subRow}>
              <span style={styles.subText}>📞 {customer.phone}</span>
              <span style={styles.subDivider}>·</span>
              <span style={styles.subText}>
                队列号：
                <span style={styles.queueNum}>
                  {generateQueueNumber(customer.type, customer.queueOrder)}
                </span>
              </span>
              <span style={styles.subDivider}>·</span>
              <span style={styles.subText}>
                到店：{formatTime(customer.arrivalTime)}
              </span>
              <span style={styles.subDivider}>·</span>
              <span
                style={{
                  ...styles.subText,
                  color: waitMinutes > 30 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                已等待 {waitMinutes} 分钟{waitMinutes > 30 && ' ⚠'}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button style={styles.btnSecondary} onClick={handlePrint}>
            🖨 打印导诊单
          </button>
          {customer.status === 'temporary_leave' ? (
            <button style={styles.btnSuccess} onClick={() => returnFromLeave(customer.id)}>
              ✅ 确认返回
            </button>
          ) : customer.status !== 'completed' && customer.status !== 'cancelled' ? (
            <button
              style={styles.btnDanger}
              onClick={() => markTemporaryLeave(customer.id)}
            >
              ⏸ 标记临时离开
            </button>
          ) : null}
        </div>
      </div>

      <div style={styles.statusBar}>
        <span style={styles.statusLabel}>当前状态：</span>
        <span
          style={{
            ...styles.statusValue,
            background: `${getCustomerStatusColor(customer.status)}20`,
            color: getCustomerStatusColor(customer.status),
            border: `1px solid ${getCustomerStatusColor(customer.status)}40`,
          }}
        >
          {getCustomerStatusLabel(customer.status)}
        </span>
        <div style={styles.statusFlow}>
          {statuses.slice(0, 6).map((s, i) => {
            const currentIdx = statuses.indexOf(customer.status)
            const thisIdx = statuses.indexOf(s)
            const isActive = thisIdx === currentIdx
            const isPast = thisIdx < currentIdx
            return (
              <button
                key={s}
                onClick={() => updateCustomerStatus(customer.id, s)}
                style={{
                  ...styles.flowStep,
                  ...(isActive ? styles.flowStepActive : {}),
                  ...(isPast ? styles.flowStepPast : {}),
                }}
              >
                <span
                  style={{
                    ...styles.flowDot,
                    background: isActive
                      ? getCustomerStatusColor(customer.status)
                      : isPast
                      ? 'var(--accent-success)'
                      : 'var(--bg-tertiary)',
                  }}
                >
                  {isPast && '✓'}
                </span>
                {getCustomerStatusLabel(s)}
              </button>
            )
          })}
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            ...styles.tab,
            ...(activeTab === 'info' ? styles.tabActive : {}),
          }}
        >
          详细信息
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            ...styles.tab,
            ...(activeTab === 'timeline' ? styles.tabActive : {}),
          }}
        >
          服务轨迹
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'info' && (
          <div style={styles.infoGrid}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>📍 分诊信息</div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>候诊区域</label>
                <div style={styles.btnGroup}>
                  {zones.map((z) => (
                    <button
                      key={z}
                      onClick={() => setCustomerZone(customer.id, z, customer.floor)}
                      style={{
                        ...styles.optionBtn,
                        ...(customer.zone === z
                          ? {
                              background: `${getZoneColor(z)}20`,
                              borderColor: getZoneColor(z),
                              color: getZoneColor(z),
                            }
                          : {}),
                      }}
                    >
                      {z}区
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>所在楼层</label>
                <div style={styles.btnGroup}>
                  {floors.map((f) => (
                    <button
                      key={f}
                      onClick={() => setCustomerZone(customer.id, customer.zone, f)}
                      style={{
                        ...styles.optionBtn,
                        ...(customer.floor === f ? styles.optionBtnActive : {}),
                      }}
                    >
                      {f}楼
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>顾客类型</label>
                <div style={styles.btnGroup}>
                  {types.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateCustomer(customer.id, { type: t })}
                      style={{
                        ...styles.optionBtn,
                        ...(customer.type === t
                          ? {
                              background: `${getCustomerTypeColor(t)}20`,
                              borderColor: getCustomerTypeColor(t),
                              color: getCustomerTypeColor(t),
                            }
                          : {}),
                      }}
                    >
                      {getCustomerTypeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>👥 人员分配</div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>咨询师</label>
                <select
                  value={customer.consultantId || ''}
                  onChange={(e) => {
                    if (e.target.value) assignConsultant(customer.id, e.target.value)
                  }}
                  style={styles.select}
                >
                  <option value="">未分配</option>
                  {availableConsultants.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.status === 'free' ? '空闲' : s.status === 'busy' ? '接诊中' : '休息'}
                    </option>
                  ))}
                </select>
                {consultant && (
                  <div style={styles.assignedInfo}>
                    当前: <strong>{consultant.name}</strong>
                  </div>
                )}
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>医生</label>
                <select
                  value={customer.doctorId || ''}
                  onChange={(e) => {
                    if (e.target.value) assignDoctor(customer.id, e.target.value)
                  }}
                  style={styles.select}
                >
                  <option value="">未分配</option>
                  {availableDoctors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.status === 'free' ? '空闲' : s.status === 'busy' ? '接诊中' : '休息'}
                    </option>
                  ))}
                </select>
                {doctor && (
                  <div style={styles.assignedInfo}>
                    当前: <strong>{doctor.name}</strong>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>📋 项目与检查</div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>项目意向</label>
                <div style={styles.intentTags}>
                  {customer.intent.length > 0 ? (
                    customer.intent.map((i, idx) => (
                      <span key={idx} style={styles.intentTag}>
                        {i}
                      </span>
                    ))
                  ) : (
                    <span style={styles.mutedText}>暂未填写意向项目</span>
                  )}
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>检查状态</label>
                <div style={styles.checkRow}>
                  <button
                    onClick={() => markSkinTestDone(customer.id)}
                    disabled={customer.hasSkinTest}
                    style={{
                      ...styles.checkBtn,
                      ...(customer.hasSkinTest ? styles.checkBtnDone : {}),
                    }}
                  >
                    {customer.hasSkinTest ? '✅ 皮肤检测已完成' : '⏳ 皮肤检测未完成 - 点击标记'}
                  </button>
                  <button
                    onClick={() => markPhotoDone(customer.id)}
                    disabled={customer.hasPhoto}
                    style={{
                      ...styles.checkBtn,
                      ...(customer.hasPhoto ? styles.checkBtnDone : {}),
                    }}
                  >
                    {customer.hasPhoto ? '✅ 拍照已完成' : '⏳ 拍照未完成 - 点击标记'}
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>🏥 当前位置</div>
              <div style={styles.location}>
                {room ? (
                  <>
                    <div style={styles.roomName}>{room.name}</div>
                    <div style={styles.roomSub}>
                      {room.floor}楼 · {customer.zone}区 ·{' '}
                      {room.type === 'skin_test'
                        ? '皮肤检测'
                        : room.type === 'photo'
                        ? '拍照室'
                        : room.type === 'consultation'
                        ? '面诊室'
                        : room.type === 'injection'
                        ? '注射咨询'
                        : room.type === 'treatment'
                        ? '治疗室'
                        : '休息区'}
                    </div>
                  </>
                ) : (
                  <div style={styles.mutedText}>顾客当前未在指定房间</div>
                )}
              </div>
              {customer.reminders.length > 0 && (
                <div style={styles.reminders}>
                  <div style={styles.reminderTitle}>⚠️ 提醒事项</div>
                  {customer.reminders.map((r, i) => (
                    <div key={i} style={styles.reminderItem}>
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={styles.timelineCard}>
            <div style={styles.cardTitle}>📊 服务时间线</div>
            <div style={styles.timeline}>
              {[
                { time: customer.arrivalTime, label: '到店签到', done: true },
                {
                  time: customer.hasSkinTest ? customer.arrivalTime : undefined,
                  label: '皮肤检测',
                  done: customer.hasSkinTest,
                },
                {
                  time: customer.hasPhoto ? customer.arrivalTime : undefined,
                  label: '医学拍照',
                  done: customer.hasPhoto,
                },
                {
                  time: customer.status === 'consultation' ? customer.arrivalTime : undefined,
                  label: '咨询师面诊',
                  done: ['consultation', 'injection_consult', 'treatment', 'completed'].includes(
                    customer.status
                  ),
                },
                {
                  time: customer.status === 'injection_consult' ? customer.arrivalTime : undefined,
                  label: '医生注射咨询',
                  done: ['injection_consult', 'treatment', 'completed'].includes(customer.status),
                },
                {
                  time: customer.status === 'treatment' ? customer.arrivalTime : undefined,
                  label: '项目治疗',
                  done: ['treatment', 'completed'].includes(customer.status),
                },
                {
                  time: customer.status === 'completed' ? customer.arrivalTime : undefined,
                  label: '完成接待',
                  done: customer.status === 'completed',
                },
              ].map((step, idx, arr) => (
                <div key={idx} style={styles.timelineItem}>
                  <div style={styles.timelineLineCol}>
                    <span
                      style={{
                        ...styles.timelineDot,
                        background: step.done ? 'var(--accent-success)' : 'var(--bg-tertiary)',
                      }}
                    >
                      {step.done && '✓'}
                    </span>
                    {idx < arr.length - 1 && (
                      <div
                        style={{
                          ...styles.timelineLine,
                          background: step.done ? 'var(--accent-success)' : 'var(--bg-tertiary)',
                        }}
                      />
                    )}
                  </div>
                  <div style={styles.timelineContent}>
                    <div
                      style={{
                        ...styles.timelineLabel,
                        color: step.done ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {step.label}
                    </div>
                    {step.time && (
                      <div style={styles.timelineTime}>{formatDateTime(step.time)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '64px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '18px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  emptyHint: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '16px',
  },
  quickList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    width: '50%',
  },
  quickItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    alignItems: 'center',
  },
  quickName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  quickType: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
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
    padding: '16px',
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '28px',
    fontWeight: 700,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  name: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    color: 'white',
    fontWeight: 600,
  },
  tempBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
  },
  subRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  subText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  subDivider: {
    color: 'var(--border-light)',
  },
  queueNum: {
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  headerRight: {
    display: 'flex',
    gap: '10px',
  },
  btnSecondary: {
    padding: '10px 18px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
  },
  btnSuccess: {
    padding: '10px 18px',
    background: 'var(--accent-success)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
  },
  btnDanger: {
    padding: '10px 18px',
    background: 'var(--accent-warning)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
  },
  statusLabel: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  statusValue: {
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
  },
  statusFlow: {
    flex: 1,
    display: 'flex',
    gap: '4px',
    justifyContent: 'flex-end',
  },
  flowStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    transition: 'all 0.2s',
  },
  flowStepActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  flowStepPast: {
    color: 'var(--accent-success)',
  },
  flowDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    background: 'var(--bg-secondary)',
    padding: '4px',
    borderRadius: '8px',
    width: 'fit-content',
  },
  tab: {
    padding: '8px 20px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    borderRadius: '6px',
    fontWeight: 500,
  },
  tabActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    alignContent: 'start',
  },
  card: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  btnGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  optionBtn: {
    padding: '8px 16px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  optionBtnActive: {
    background: 'var(--accent-primary)20',
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-primary)',
  },
  select: {
    padding: '10px 14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  assignedInfo: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  intentTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  intentTag: {
    padding: '6px 12px',
    background: 'var(--accent-secondary)20',
    border: '1px solid var(--accent-secondary)40',
    color: 'var(--accent-secondary)',
    borderRadius: '6px',
    fontSize: '13px',
  },
  mutedText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  checkRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkBtn: {
    padding: '12px 14px',
    background: 'var(--bg-primary)',
    border: '1px dashed var(--border-light)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  checkBtnDone: {
    background: 'var(--accent-success)15',
    border: '1px solid var(--accent-success)40',
    color: 'var(--accent-success)',
  },
  location: {
    padding: '16px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
  },
  roomName: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  roomSub: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  reminders: {
    padding: '12px',
    background: 'var(--accent-warning)15',
    border: '1px solid var(--accent-warning)40',
    borderRadius: '8px',
  },
  reminderTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--accent-warning)',
    marginBottom: '8px',
  },
  reminderItem: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    padding: '4px 0',
  },
  timelineCard: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '20px',
  },
  timeline: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
  },
  timelineLineCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '24px',
  },
  timelineDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    minHeight: '32px',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '20px',
  },
  timelineLabel: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  timelineTime: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
}
