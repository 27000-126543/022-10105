import { create } from 'zustand'
import type { Customer, Staff, Room, ExceptionEvent, CustomerStatus, WaitingZone, CustomerType } from '../types'
import { mockCustomers, mockStaff, mockRooms, mockExceptions } from '../data/mockData'

interface TriageState {
  customers: Customer[]
  staff: Staff[]
  rooms: Room[]
  exceptions: ExceptionEvent[]
  selectedCustomerId: string | null
  selectedExceptionId: string | null
  activePanel: 'today' | 'zones' | 'detail' | 'navigation' | 'exceptions'
  exceptionFilter: string | null

  selectCustomer: (id: string | null) => void
  selectException: (id: string | null) => void
  setActivePanel: (panel: TriageState['activePanel']) => void

  addCustomer: (data: Partial<Customer> & { name: string; phone: string }) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  updateCustomerStatus: (id: string, status: CustomerStatus) => void
  setCustomerZone: (id: string, zone: WaitingZone, floor: number) => void
  assignConsultant: (customerId: string, staffId: string) => void
  assignDoctor: (customerId: string, staffId: string) => void
  markSkinTestDone: (id: string) => void
  markPhotoDone: (id: string) => void
  markTemporaryLeave: (id: string) => void
  returnFromLeave: (id: string) => void
  callCustomer: (id: string) => void
  assignCustomerToRoom: (customerId: string, roomId: string) => void
  reorderCustomers: (fromIndex: number, toIndex: number, context?: { zone?: WaitingZone; customerIds?: string[] }) => void

  resolveException: (id: string, notes?: string) => void
  addException: (event: Omit<ExceptionEvent, 'id' | 'createdAt' | 'resolved'>) => void

  getStaffById: (id: string) => Staff | undefined
  getRoomById: (id: string) => Room | undefined
  getExceptionById: (id: string) => ExceptionEvent | undefined
  getCustomersByZone: (zone: WaitingZone) => Customer[]
  getCustomersByStatus: (status: CustomerStatus) => Customer[]
  getWaitingCustomers: () => Customer[]
  getActiveExceptions: () => ExceptionEvent[]
}

let customerIdCounter = 100
let exceptionIdCounter = 100

export const useTriageStore = create<TriageState>((set, get) => ({
  customers: [...mockCustomers],
  staff: [...mockStaff],
  rooms: [...mockRooms],
  exceptions: [...mockExceptions],
  selectedCustomerId: null,
  selectedExceptionId: null,
  activePanel: 'today',
  exceptionFilter: null,

  selectCustomer: (id) => set({ selectedCustomerId: id, selectedExceptionId: null }),
  selectException: (id) => set({ selectedExceptionId: id, selectedCustomerId: null }),
  setActivePanel: (panel) => set({ activePanel: panel }),

  addCustomer: (data) => {
    const now = new Date()
    const newCustomer: Customer = {
      id: `c${++customerIdCounter}`,
      name: data.name,
      phone: data.phone,
      type: (data.type as CustomerType) || 'first_visit',
      status: 'waiting',
      arrivalTime: now,
      zone: data.zone || 'A',
      floor: data.floor || 1,
      intent: data.intent || [],
      isTemporary: true,
      queueOrder: get().customers.length + 1,
      waitStartAt: now,
      hasSkinTest: false,
      hasPhoto: false,
      reminders: [],
    }
    set({ customers: [...get().customers, newCustomer], selectedCustomerId: newCustomer.id })
  },

  updateCustomer: (id, updates) => {
    set({
      customers: get().customers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })
  },

  updateCustomerStatus: (id, status) => {
    const customer = get().customers.find((c) => c.id === id)
    if (!customer) return

    const updates: Partial<Customer> = { status }

    if (status === 'temporary_leave') {
      updates.previousStatus = customer.status
      updates.temporaryLeaveAt = new Date()
    }

    if (['completed', 'cancelled'].includes(status)) {
      const staff = get().staff
      const updatedStaff = staff.map((s) =>
        s.currentCustomerId === id ? { ...s, status: 'free' as const, currentCustomerId: undefined } : s
      )
      const rooms = get().rooms
      const updatedRooms = rooms.map((r) =>
        r.occupiedBy === id ? { ...r, status: 'available' as const, occupiedBy: undefined } : r
      )
      set({ staff: updatedStaff, rooms: updatedRooms })
    }

    set({
      customers: get().customers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })
  },

  setCustomerZone: (id, zone, floor) => {
    get().updateCustomer(id, { zone, floor })
  },

  assignConsultant: (customerId, staffId) => {
    get().updateCustomer(customerId, { consultantId: staffId })
    set({
      staff: get().staff.map((s) =>
        s.id === staffId ? { ...s, status: 'busy' as const, currentCustomerId: customerId } : s
      ),
    })
  },

  assignDoctor: (customerId, staffId) => {
    get().updateCustomer(customerId, { doctorId: staffId })
    set({
      staff: get().staff.map((s) =>
        s.id === staffId ? { ...s, status: 'busy' as const, currentCustomerId: customerId } : s
      ),
    })
  },

  markSkinTestDone: (id) => {
    get().updateCustomer(id, { hasSkinTest: true })
  },

  markPhotoDone: (id) => {
    get().updateCustomer(id, { hasPhoto: true })
  },

  markTemporaryLeave: (id) => {
    const customer = get().customers.find((c) => c.id === id)
    if (!customer) return
    get().updateCustomerStatus(id, 'temporary_leave')
    get().addException({
      type: 'temporary_leave',
      customerId: id,
      customerName: customer.name,
      details: '顾客临时离开，等待返回',
    })
  },

  returnFromLeave: (id) => {
    const customer = get().customers.find((c) => c.id === id)
    if (!customer) return
    get().updateCustomer(id, {
      status: customer.previousStatus || 'waiting',
      temporaryLeaveAt: undefined,
      previousStatus: undefined,
    })
  },

  callCustomer: (id) => {
    const customer = get().customers.find((c) => c.id === id)
    if (!customer) return
    if (customer.status !== 'waiting') return
    get().updateCustomerStatus(id, 'called')
  },

  assignCustomerToRoom: (customerId, roomId) => {
    const customer = get().customers.find((c) => c.id === customerId)
    const room = get().rooms.find((r) => r.id === roomId)
    if (!customer || !room) return
    if (room.status !== 'available') return

    const statusMap: Record<string, CustomerStatus> = {
      skin_test: 'skin_test',
      photo: 'photo_room',
      consultation: 'consultation',
      injection: 'injection_consult',
      treatment: 'treatment',
      rest: 'waiting',
    }

    const newStatus = statusMap[room.type] || 'waiting'

    get().updateCustomer(customerId, {
      status: newStatus,
      roomId: roomId,
      zone: room.zone,
      floor: room.floor,
    })

    set({
      rooms: get().rooms.map((r) =>
        r.id === roomId ? { ...r, status: 'occupied' as const, occupiedBy: customerId } : r
      ),
    })
  },

  reorderCustomers: (fromIndex, toIndex, context) => {
    const allCustomers = get().customers
    const customerIds = context?.customerIds

    const fullList = [...allCustomers].sort((a, b) => a.queueOrder - b.queueOrder)

    if (fullList.length === 0) return

    const getInsertOrder = (idx: number): number => {
      if (idx <= 0) return fullList[0].queueOrder - 1000
      if (idx >= fullList.length) return fullList[fullList.length - 1].queueOrder + 1000
      return (fullList[idx - 1].queueOrder + fullList[idx].queueOrder) / 2
    }

    if (customerIds && customerIds.length > 0) {
      const draggedId = customerIds[fromIndex]
      const targetId = customerIds[toIndex]

      if (!draggedId || !targetId || draggedId === targetId) return

      const dragIdx = fullList.findIndex((c) => c.id === draggedId)
      const targetIdx = fullList.findIndex((c) => c.id === targetId)

      if (dragIdx === -1 || targetIdx === -1) return

      let insertIdx: number
      if (fromIndex < toIndex) {
        insertIdx = targetIdx + 1
      } else {
        insertIdx = targetIdx
      }

      const newOrder = getInsertOrder(insertIdx)

      set({
        customers: allCustomers.map((c) =>
          c.id === draggedId ? { ...c, queueOrder: newOrder } : c
        ),
      })
    } else if (context?.zone) {
      const zone = context.zone
      const zoneList = fullList.filter((c) => c.zone === zone)

      if (fromIndex < 0 || fromIndex >= zoneList.length || toIndex < 0 || toIndex >= zoneList.length) return
      if (fromIndex === toIndex) return

      const draggedId = zoneList[fromIndex].id
      const targetId = zoneList[toIndex].id

      const dragIdx = fullList.findIndex((c) => c.id === draggedId)
      const targetIdx = fullList.findIndex((c) => c.id === targetId)

      let insertIdx: number
      if (fromIndex < toIndex) {
        insertIdx = targetIdx + 1
      } else {
        insertIdx = targetIdx
      }

      const newOrder = getInsertOrder(insertIdx)

      set({
        customers: allCustomers.map((c) =>
          c.id === draggedId ? { ...c, queueOrder: newOrder } : c
        ),
      })
    } else {
      if (fromIndex < 0 || fromIndex >= fullList.length || toIndex < 0 || toIndex >= fullList.length) return
      if (fromIndex === toIndex) return

      const draggedId = fullList[fromIndex].id

      let insertIdx: number
      if (fromIndex < toIndex) {
        insertIdx = toIndex + 1
      } else {
        insertIdx = toIndex
      }

      const newOrder = getInsertOrder(insertIdx)

      set({
        customers: allCustomers.map((c) =>
          c.id === draggedId ? { ...c, queueOrder: newOrder } : c
        ),
      })
    }
  },

  resolveException: (id, notes) => {
    set({
      exceptions: get().exceptions.map((e) =>
        e.id === id ? { ...e, resolved: true, resolvedAt: new Date(), notes } : e
      ),
    })
  },

  addException: (event) => {
    const newEvent: ExceptionEvent = {
      ...event,
      id: `e${++exceptionIdCounter}`,
      createdAt: new Date(),
      resolved: false,
    }
    set({ exceptions: [...get().exceptions, newEvent] })
  },

  getStaffById: (id) => get().staff.find((s) => s.id === id),
  getRoomById: (id) => get().rooms.find((r) => r.id === id),
  getExceptionById: (id) => get().exceptions.find((e) => e.id === id),

  getCustomersByZone: (zone) =>
    get()
      .customers.filter((c) => c.zone === zone)
      .sort((a, b) => a.queueOrder - b.queueOrder),

  getCustomersByStatus: (status) => get().customers.filter((c) => c.status === status),

  getWaitingCustomers: () =>
    get()
      .customers.filter(
        (c) =>
          c.status !== 'completed' && c.status !== 'cancelled'
      )
      .sort((a, b) => a.queueOrder - b.queueOrder),

  getActiveExceptions: () => get().exceptions.filter((e) => !e.resolved),
}))
