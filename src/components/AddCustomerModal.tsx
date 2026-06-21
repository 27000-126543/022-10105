import { useState } from 'react'
import type { CustomerType, WaitingZone } from '../types'
import { useTriageStore } from '../store/triageStore'
import { getCustomerTypeLabel, getCustomerTypeColor, getZoneColor } from '../utils/format'

interface Props {
  onClose: () => void
}

const commonIntents = [
  '双眼皮', '隆鼻', '吸脂', '隆胸', '瘦脸针', '除皱针',
  '玻尿酸', '水光针', '光子嫩肤', '热玛吉', '线雕',
  '祛斑', '脱毛', '皮肤管理', '双眼皮修复', '陪同咨询',
]

export default function AddCustomerModal({ onClose }: Props) {
  const addCustomer = useTriageStore((s) => s.addCustomer)
  const customers = useTriageStore((s) => s.customers)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<CustomerType>('first_visit')
  const [zone, setZone] = useState<WaitingZone>('A')
  const [floor, setFloor] = useState(1)
  const [selectedIntents, setSelectedIntents] = useState<string[]>([])
  const [error, setError] = useState('')

  const types: CustomerType[] = ['first_visit', 'revisit', 'companion']
  const zones: WaitingZone[] = ['A', 'B', 'C', 'D']

  const toggleIntent = (i: string) => {
    setSelectedIntents((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    )
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('请输入顾客姓名')
      return
    }
    if (!phone.trim() || phone.length < 7) {
      setError('请输入有效的联系电话')
      return
    }

    const duplicate = customers.find(
      (c) => c.phone === phone && c.status !== 'completed' && c.status !== 'cancelled'
    )
    if (duplicate) {
      setError(`该手机号顾客「${duplicate.name}」已签到，请勿重复签到`)
      return
    }

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      type,
      zone,
      floor,
      intent: selectedIntents,
    })
    onClose()
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>新增临时到店顾客</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.body}>
          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>顾客姓名 *</label>
              <input
                style={styles.input}
                placeholder="请输入姓名"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                autoFocus
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>联系电话 *</label>
              <input
                style={styles.input}
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
                maxLength={11}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>顾客类型</label>
            <div style={styles.typeOptions}>
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    ...styles.typeOption,
                    ...(type === t
                      ? {
                          borderColor: getCustomerTypeColor(t),
                          background: `${getCustomerTypeColor(t)}15`,
                          color: getCustomerTypeColor(t),
                        }
                      : {}),
                  }}
                >
                  <span
                    style={{
                      ...styles.typeDot,
                      background: getCustomerTypeColor(t),
                    }}
                  />
                  {getCustomerTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>候诊区域</label>
              <div style={styles.zoneOptions}>
                {zones.map((z) => (
                  <button
                    key={z}
                    onClick={() => setZone(z)}
                    style={{
                      ...styles.zoneOption,
                      ...(zone === z
                        ? {
                            borderColor: getZoneColor(z),
                            background: `${getZoneColor(z)}20`,
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
            <div style={styles.formGroup}>
              <label style={styles.label}>所在楼层</label>
              <div style={styles.floorOptions}>
                {[1, 2, 3].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFloor(f)}
                    style={{
                      ...styles.floorOption,
                      ...(floor === f ? styles.floorOptionActive : {}),
                    }}
                  >
                    {f}楼
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>项目意向 (可多选)</label>
            <div style={styles.intentGrid}>
              {commonIntents.map((i) => (
                <button
                  key={i}
                  onClick={() => toggleIntent(i)}
                  style={{
                    ...styles.intentChip,
                    ...(selectedIntents.includes(i) ? styles.intentChipActive : {}),
                  }}
                >
                  {selectedIntents.includes(i) && '✓ '}
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnCancel}>
            取消
          </button>
          <button onClick={handleSubmit} style={styles.btnSubmit}>
            ✅ 确认签到
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    width: '640px',
    maxHeight: '90vh',
    background: 'var(--bg-secondary)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-muted)',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorBox: {
    padding: '12px 16px',
    background: 'var(--accent-primary)15',
    border: '1px solid var(--accent-primary)40',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--accent-primary)',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  formGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '12px 14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  typeOptions: {
    display: 'flex',
    gap: '10px',
  },
  typeOption: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'var(--bg-primary)',
    border: '2px solid var(--border-color)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
  },
  typeDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  zoneOptions: {
    display: 'flex',
    gap: '8px',
  },
  zoneOption: {
    flex: 1,
    padding: '12px',
    background: 'var(--bg-primary)',
    border: '2px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
  },
  floorOptions: {
    display: 'flex',
    gap: '8px',
  },
  floorOption: {
    flex: 1,
    padding: '12px',
    background: 'var(--bg-primary)',
    border: '2px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
  },
  floorOptionActive: {
    borderColor: 'var(--accent-primary)',
    background: 'var(--accent-primary)20',
    color: 'var(--accent-primary)',
  },
  intentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  intentChip: {
    padding: '10px 12px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
  },
  intentChipActive: {
    background: 'var(--accent-secondary)20',
    borderColor: 'var(--accent-secondary)',
    color: 'var(--accent-secondary)',
    fontWeight: 500,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid var(--border-color)',
  },
  btnCancel: {
    padding: '10px 24px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
  },
  btnSubmit: {
    padding: '10px 28px',
    background: 'var(--accent-primary)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
  },
}
