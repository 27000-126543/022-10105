import type { CustomerType, CustomerStatus, StaffStatus, WaitingZone } from '../types'

export const formatTime = (date?: Date): string => {
  if (!date) return '--:--'
  const d = new Date(date)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export const formatDateTime = (date?: Date): string => {
  if (!date) return '--'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export const getWaitMinutes = (start?: Date): number => {
  if (!start) return 0
  return Math.floor((Date.now() - new Date(start).getTime()) / 60000)
}

export const getCustomerTypeLabel = (type: CustomerType): string => {
  const map: Record<CustomerType, string> = {
    first_visit: '初诊',
    revisit: '复诊',
    companion: '陪同',
  }
  return map[type]
}

export const getCustomerTypeColor = (type: CustomerType): string => {
  const map: Record<CustomerType, string> = {
    first_visit: '#ef4444',
    revisit: '#3b82f6',
    companion: '#f59e0b',
  }
  return map[type]
}

export const getCustomerStatusLabel = (status: CustomerStatus): string => {
  const map: Record<CustomerStatus, string> = {
    waiting: '候诊中',
    skin_test: '皮肤检测',
    photo_room: '拍照中',
    consultation: '面诊中',
    injection_consult: '注射咨询',
    treatment: '治疗中',
    temporary_leave: '临时离开',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status]
}

export const getCustomerStatusColor = (status: CustomerStatus): string => {
  const map: Record<CustomerStatus, string> = {
    waiting: '#6366f1',
    skin_test: '#06b6d4',
    photo_room: '#8b5cf6',
    consultation: '#10b981',
    injection_consult: '#f97316',
    treatment: '#14b8a6',
    temporary_leave: '#94a3b8',
    completed: '#64748b',
    cancelled: '#475569',
  }
  return map[status]
}

export const getStaffStatusLabel = (status: StaffStatus): string => {
  const map: Record<StaffStatus, string> = {
    free: '空闲',
    busy: '接诊中',
    break: '休息',
    offline: '离线',
  }
  return map[status]
}

export const getStaffStatusColor = (status: StaffStatus): string => {
  const map: Record<StaffStatus, string> = {
    free: '#10b981',
    busy: '#ef4444',
    break: '#f59e0b',
    offline: '#64748b',
  }
  return map[status]
}

export const getZoneLabel = (zone: WaitingZone): string => {
  return `${zone}区`
}

export const getZoneColor = (zone: WaitingZone): string => {
  const map: Record<WaitingZone, string> = {
    A: '#ef4444',
    B: '#3b82f6',
    C: '#10b981',
    D: '#f59e0b',
  }
  return map[zone]
}

export const maskPhone = (phone: string): string => {
  if (phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export const generateQueueNumber = (type: CustomerType, order: number): string => {
  const prefix = type === 'first_visit' ? 'C' : type === 'revisit' ? 'R' : 'A'
  return `${prefix}${String(order).padStart(3, '0')}`
}
