import { useState } from 'react'
import type { Room } from '../types'
import { useTriageStore } from '../store/triageStore'
import { getZoneColor } from '../utils/format'

const roomTypeLabels: Record<Room['type'], string> = {
  skin_test: '皮肤检测',
  photo: '拍照室',
  consultation: '面诊室',
  injection: '注射咨询',
  treatment: '治疗室',
  rest: '休息区',
}

const statusLabels: Record<Room['status'], string> = {
  available: '空闲',
  occupied: '使用中',
  cleaning: '清洁中',
  maintenance: '维护中',
}

const statusColors: Record<Room['status'], string> = {
  available: '#10b981',
  occupied: '#ef4444',
  cleaning: '#f59e0b',
  maintenance: '#64748b',
}

export default function RoomNavigation() {
  const rooms = useTriageStore((s) => s.rooms)
  const customers = useTriageStore((s) => s.customers)
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all')

  const floors = [1, 2, 3]

  const filteredRooms =
    selectedFloor === 'all' ? rooms : rooms.filter((r) => r.floor === selectedFloor)

  const groupedRooms = floors.reduce((acc, floor) => {
    acc[floor] = filteredRooms.filter((r) => r.floor === floor)
    return acc
  }, {} as Record<number, Room[]>)

  const getOccupant = (roomId: string) => {
    return customers.find((c) => c.roomId === roomId)
  }

  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'available').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    cleaning: rooms.filter((r) => r.status === 'cleaning').length,
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>房间导航 & 状态</h2>
          <div style={styles.statsRow}>
            <div style={styles.statPill}>
              <span style={{ ...styles.statDot, background: statusColors.available }} />
              空闲 <strong>{stats.available}</strong>
            </div>
            <div style={styles.statPill}>
              <span style={{ ...styles.statDot, background: statusColors.occupied }} />
              使用中 <strong>{stats.occupied}</strong>
            </div>
            <div style={styles.statPill}>
              <span style={{ ...styles.statDot, background: statusColors.cleaning }} />
              清洁中 <strong>{stats.cleaning}</strong>
            </div>
            <div style={styles.statPill}>
              总计 <strong>{stats.total}</strong> 间
            </div>
          </div>
        </div>
        <div style={styles.floorTabs}>
          <button
            onClick={() => setSelectedFloor('all')}
            style={{
              ...styles.floorTab,
              ...(selectedFloor === 'all' ? styles.floorTabActive : {}),
            }}
          >
            全部楼层
          </button>
          {floors.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              style={{
                ...styles.floorTab,
                ...(selectedFloor === f ? styles.floorTabActive : {}),
              }}
            >
              {f}楼
            </button>
          ))}
        </div>
      </div>

      <div style={styles.floorGrid}>
        {Object.entries(groupedRooms)
          .filter(([_, r]) => r.length > 0)
          .map(([floor, floorRooms]) => (
            <div key={floor} style={styles.floorSection}>
              <div style={styles.floorHeader}>
                <span style={styles.floorLabel}>🏢 {floor}楼</span>
                <span style={styles.floorCount}>
                  {floorRooms.filter((r) => r.status === 'available').length} / {floorRooms.length} 可用
                </span>
              </div>

              <div style={styles.zoneGroup}>
                {(['A', 'B', 'C', 'D'] as const).map((zone) => {
                  const zoneRooms = floorRooms.filter((r) => r.zone === zone)
                  if (zoneRooms.length === 0) return null
                  return (
                    <div key={zone} style={styles.zoneBlock}>
                      <div
                        style={{
                          ...styles.zoneLabel,
                          borderLeft: `3px solid ${getZoneColor(zone)}`,
                          color: getZoneColor(zone),
                        }}
                      >
                        {zone}区
                      </div>
                      <div style={styles.roomGrid}>
                        {zoneRooms.map((room) => {
                          const occupant = getOccupant(room.id)
                          return (
                            <div
                              key={room.id}
                              style={{
                                ...styles.roomCard,
                                borderTop: `3px solid ${statusColors[room.status]}`,
                                ...(room.status === 'available' ? styles.roomAvailable : {}),
                              }}
                            >
                              <div style={styles.roomHeader}>
                                <span style={styles.roomName}>{room.name}</span>
                                <span
                                  style={{
                                    ...styles.roomStatus,
                                    background: `${statusColors[room.status]}20`,
                                    color: statusColors[room.status],
                                  }}
                                >
                                  {statusLabels[room.status]}
                                </span>
                              </div>
                              <div style={styles.roomType}>
                                {roomTypeLabels[room.type]}
                              </div>
                              {occupant ? (
                                <div style={styles.occupant}>
                                  <span style={styles.occupantAvatar}>
                                    {occupant.name.slice(-1)}
                                  </span>
                                  <div>
                                    <div style={styles.occupantName}>{occupant.name}</div>
                                    <div style={styles.occupantSub}>进行中</div>
                                  </div>
                                </div>
                              ) : (
                                <div style={styles.emptySlot}>
                                  {room.status === 'available' ? '可使用' : statusLabels[room.status]}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>

      <div style={styles.quickNav}>
        <div style={styles.quickNavTitle}>🚀 快速导航指引</div>
        <div style={styles.quickNavGrid}>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>🧴</span>
            <div>
              <div style={styles.navName}>皮肤检测</div>
              <div style={styles.navSub}>1楼 · A区</div>
            </div>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>📷</span>
            <div>
              <div style={styles.navName}>医学拍照</div>
              <div style={styles.navSub}>1楼 · A区</div>
            </div>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>💬</span>
            <div>
              <div style={styles.navName}>初诊面诊</div>
              <div style={styles.navSub}>2楼 · A区</div>
            </div>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>🔄</span>
            <div>
              <div style={styles.navName}>复诊咨询</div>
              <div style={styles.navSub}>2楼 · B区</div>
            </div>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>💉</span>
            <div>
              <div style={styles.navName}>注射咨询</div>
              <div style={styles.navSub}>3楼 · C区</div>
            </div>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>✨</span>
            <div>
              <div style={styles.navName}>治疗操作</div>
              <div style={styles.navSub}>3楼 · D区</div>
            </div>
          </div>
        </div>
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
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  statsRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  statDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
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
    fontWeight: 500,
  },
  floorTabActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  floorGrid: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  floorSection: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '16px',
  },
  floorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  floorLabel: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  floorCount: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  zoneGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  zoneBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  zoneLabel: {
    fontSize: '13px',
    fontWeight: 600,
    paddingLeft: '10px',
  },
  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
  },
  roomCard: {
    background: 'var(--bg-primary)',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  roomAvailable: {
    background: 'var(--bg-primary)',
  },
  roomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  roomStatus: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  roomType: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  occupant: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    background: 'var(--accent-primary)10',
    borderRadius: '6px',
    marginTop: '4px',
  },
  occupantAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-primary), #f97316)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 600,
  },
  occupantName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  occupantSub: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  emptySlot: {
    padding: '8px 10px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  quickNav: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '16px',
  },
  quickNavTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  },
  quickNavGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '10px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
  },
  navIcon: {
    fontSize: '24px',
  },
  navName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  navSub: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
}
