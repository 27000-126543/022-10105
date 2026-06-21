export type CustomerType = 'first_visit' | 'revisit' | 'companion'
export type CustomerStatus =
  | 'waiting'
  | 'called'
  | 'skin_test'
  | 'photo_room'
  | 'consultation'
  | 'injection_consult'
  | 'treatment'
  | 'temporary_leave'
  | 'completed'
  | 'cancelled'
export type WaitingZone = 'A' | 'B' | 'C' | 'D'
export type StaffStatus = 'free' | 'busy' | 'break' | 'offline'

export interface Staff {
  id: string
  name: string
  role: 'consultant' | 'doctor' | 'nurse'
  status: StaffStatus
  zone?: WaitingZone
  currentCustomerId?: string
  floor: number
}

export interface Room {
  id: string
  name: string
  type: 'skin_test' | 'photo' | 'consultation' | 'injection' | 'treatment' | 'rest'
  floor: number
  zone: WaitingZone
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance'
  occupiedBy?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  type: CustomerType
  status: CustomerStatus
  arrivalTime: Date
  expectedTime?: Date
  zone: WaitingZone
  floor: number
  intent: string[]
  consultantId?: string
  doctorId?: string
  roomId?: string
  notes?: string
  isTemporary: boolean
  queueOrder: number
  waitStartAt?: Date
  temporaryLeaveAt?: Date
  previousStatus?: CustomerStatus
  hasSkinTest: boolean
  hasPhoto: boolean
  reminders: string[]
}

export interface ExceptionEvent {
  id: string
  type: 'timeout' | 'wrong_floor' | 'duplicate_checkin' | 'temporary_leave' | 'no_show'
  customerId: string
  customerName: string
  customerPhone?: string
  createdAt: Date
  resolved: boolean
  resolvedAt?: Date
  notes?: string
  details?: string
}

export interface HandoverRecord {
  customerId: string
  customerName: string
  status: CustomerStatus
  consultantName?: string
  doctorName?: string
  intent: string[]
  lastAction: string
  lastActionAt: Date
  notes?: string
}
