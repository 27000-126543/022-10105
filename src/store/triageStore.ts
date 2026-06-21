import { create } from 'zustand'
import type { Customer, Staff, Room, ExceptionEvent, CustomerStatus, WaitingZone, CustomerType } from '../types'
import { mockCustomers, mockStaff, mockRooms, mockExceptions } from '../data/mockData'

interface TriageState {
  customers: Customer[]
  staff: Staff[]
  rooms: Room[]
  exceptions: ExceptionEvent[]
  selectedCustomerId: string | null
  activePanel: 'today' | 'zones' | 'detail' | 'navigation' | 'exceptions'

  selectCustomer: (id: string | null) => void
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
  reorderCustomers: (fromIndex: number, toIndex: number, zone?: WaitingZone) => void

  resolveException: (id: string, notes?: string) => void
  addException: (event: Omit<ExceptionEvent, 'id' | 'createdAt' | 'resolved'>) => void

  getStaffById: (id: string) => Staff | undefined
  getRoomById: (id: string) => Room | undefined
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
  activePanel: 'today',

  selectCustomer: (id) => set({ selectedCustomerId: id }),
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

  reorderCustomers: (fromIndex, toIndex, zone) => {
    const allCustomers = [...get().customers]

    let targetList: Customer[]
    if (zone) {
      targetList = allCustomers
        .filter((c) => c.zone === zone && c.status !== 'completed' && c.status !== 'cancelled')
        .sort((a, b) => a.queueOrder - b.queueOrder)
    } else {
      targetList = allCustomers
        .filter((c) => c.status !== 'completed' && c.status !== 'cancelled')
        .sort((a, b) => a.queueOrder - b.queueOrder)
    }

    if (fromIndex < 0 || fromIndex >= targetList.length || toIndex < 0 || toIndex >= targetList.length) return
    if (fromIndex === toIndex) return

    const [removed] = targetList.splice(fromIndex, 1)
    targetList.splice(toIndex, 0, removed)

    const idToNewOrder = new Map<string, number>()
    targetList.forEach((c, idx) => idToNewOrder.set(c.id, idx + 1))

    const updatedCustomers = allCustomers.map((c) => {
      const newOrder = idToNewOrder.get(c.id)
      if (newOrder !== undefined && newOrder !== c.queueOrder) {
        return { ...c, queueOrder: newOrder }
      }
      return c
    })

    set({ customers: updatedCustomers })
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
