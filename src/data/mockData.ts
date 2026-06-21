import type { Customer, Staff, Room, ExceptionEvent } from '../types'

const now = new Date()
const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30, 0)

const offset = (minutes: number) => new Date(baseTime.getTime() + minutes * 60000)

export const mockStaff: Staff[] = [
  { id: 's1', name: '李咨询师', role: 'consultant', status: 'busy', zone: 'A', currentCustomerId: 'c1', floor: 2 },
  { id: 's2', name: '王咨询师', role: 'consultant', status: 'free', zone: 'A', floor: 2 },
  { id: 's3', name: '张咨询师', role: 'consultant', status: 'busy', zone: 'B', currentCustomerId: 'c3', floor: 2 },
  { id: 's4', name: '刘咨询师', role: 'consultant', status: 'break', zone: 'B', floor: 2 },
  { id: 's5', name: '陈医生', role: 'doctor', status: 'busy', zone: 'C', currentCustomerId: 'c5', floor: 3 },
  { id: 's6', name: '赵医生', role: 'doctor', status: 'free', zone: 'C', floor: 3 },
  { id: 's7', name: '孙医生', role: 'doctor', status: 'busy', zone: 'D', currentCustomerId: 'c7', floor: 3 },
  { id: 's8', name: '周护士', role: 'nurse', status: 'free', floor: 1 },
  { id: 's9', name: '吴护士', role: 'nurse', status: 'busy', floor: 2 },
]

export const mockRooms: Room[] = [
  { id: 'r1', name: '皮肤检测1室', type: 'skin_test', floor: 1, zone: 'A', status: 'occupied', occupiedBy: 'c2' },
  { id: 'r2', name: '皮肤检测2室', type: 'skin_test', floor: 1, zone: 'A', status: 'available' },
  { id: 'r3', name: '拍照1室', type: 'photo', floor: 1, zone: 'A', status: 'available' },
  { id: 'r4', name: '拍照2室', type: 'photo', floor: 1, zone: 'A', status: 'cleaning' },
  { id: 'r5', name: '面诊室A1', type: 'consultation', floor: 2, zone: 'A', status: 'occupied', occupiedBy: 'c1' },
  { id: 'r6', name: '面诊室A2', type: 'consultation', floor: 2, zone: 'A', status: 'available' },
  { id: 'r7', name: '面诊室B1', type: 'consultation', floor: 2, zone: 'B', status: 'occupied', occupiedBy: 'c3' },
  { id: 'r8', name: '面诊室B2', type: 'consultation', floor: 2, zone: 'B', status: 'available' },
  { id: 'r9', name: '注射咨询1室', type: 'injection', floor: 3, zone: 'C', status: 'occupied', occupiedBy: 'c5' },
  { id: 'r10', name: '注射咨询2室', type: 'injection', floor: 3, zone: 'C', status: 'available' },
  { id: 'r11', name: '治疗室D1', type: 'treatment', floor: 3, zone: 'D', status: 'occupied', occupiedBy: 'c7' },
  { id: 'r12', name: '治疗室D2', type: 'treatment', floor: 3, zone: 'D', status: 'available' },
  { id: 'r13', name: '休息区A', type: 'rest', floor: 1, zone: 'A', status: 'available' },
  { id: 'r14', name: '休息区B', type: 'rest', floor: 2, zone: 'B', status: 'available' },
]

export const mockCustomers: Customer[] = [
  {
    id: 'c1', name: '张小美', phone: '138****1234', type: 'first_visit',
    status: 'consultation', arrivalTime: offset(0), zone: 'A', floor: 2,
    intent: ['双眼皮', '隆鼻'], consultantId: 's1', roomId: 'r5',
    isTemporary: false, queueOrder: 1, waitStartAt: offset(0),
    hasSkinTest: true, hasPhoto: true, reminders: [],
  },
  {
    id: 'c2', name: '李婷婷', phone: '139****5678', type: 'first_visit',
    status: 'skin_test', arrivalTime: offset(15), zone: 'A', floor: 1,
    intent: ['水光针', '光子嫩肤'], roomId: 'r1',
    isTemporary: false, queueOrder: 2, waitStartAt: offset(15),
    hasSkinTest: false, hasPhoto: false, reminders: [],
  },
  {
    id: 'c3', name: '王芳芳', phone: '137****9012', type: 'revisit',
    status: 'consultation', arrivalTime: offset(30), zone: 'B', floor: 2,
    intent: ['玻尿酸填充'], consultantId: 's3', roomId: 'r7',
    isTemporary: false, queueOrder: 3, waitStartAt: offset(30),
    hasSkinTest: true, hasPhoto: true, reminders: [],
  },
  {
    id: 'c4', name: '赵敏敏', phone: '136****3456', type: 'companion',
    status: 'waiting', arrivalTime: offset(45), zone: 'A', floor: 1,
    intent: ['陪同咨询'], isTemporary: false, queueOrder: 4, waitStartAt: offset(45),
    hasSkinTest: false, hasPhoto: false, reminders: [],
  },
  {
    id: 'c5', name: '陈静静', phone: '135****7890', type: 'first_visit',
    status: 'injection_consult', arrivalTime: offset(60), zone: 'C', floor: 3,
    intent: ['瘦脸针', '除皱针'], consultantId: 's1', doctorId: 's5', roomId: 'r9',
    isTemporary: false, queueOrder: 5, waitStartAt: offset(60),
    hasSkinTest: true, hasPhoto: true, reminders: [],
  },
  {
    id: 'c6', name: '孙丽丽', phone: '134****1122', type: 'first_visit',
    status: 'waiting', arrivalTime: offset(75), zone: 'B', floor: 2,
    intent: ['热玛吉', '线雕'], consultantId: 's3',
    isTemporary: false, queueOrder: 6, waitStartAt: offset(75),
    hasSkinTest: false, hasPhoto: false, reminders: [],
  },
  {
    id: 'c7', name: '周欢欢', phone: '133****3344', type: 'revisit',
    status: 'treatment', arrivalTime: offset(90), zone: 'D', floor: 3,
    intent: ['光子嫩肤疗程'], doctorId: 's7', roomId: 'r11',
    isTemporary: false, queueOrder: 7, waitStartAt: offset(90),
    hasSkinTest: true, hasPhoto: true, reminders: [],
  },
  {
    id: 'c8', name: '吴思思', phone: '132****5566', type: 'first_visit',
    status: 'photo_room', arrivalTime: offset(105), zone: 'A', floor: 1,
    intent: ['双眼皮修复'], consultantId: 's2',
    isTemporary: false, queueOrder: 8, waitStartAt: offset(105),
    hasSkinTest: true, hasPhoto: false, reminders: [],
  },
  {
    id: 'c9', name: '郑菲菲', phone: '131****7788', type: 'first_visit',
    status: 'temporary_leave', arrivalTime: offset(120), zone: 'B', floor: 2,
    intent: ['脱毛', '祛斑'], consultantId: 's3',
    isTemporary: false, queueOrder: 9, waitStartAt: offset(120),
    temporaryLeaveAt: offset(150), previousStatus: 'waiting',
    hasSkinTest: false, hasPhoto: false, reminders: ['顾客临时离开，请关注返回时间'],
  },
  {
    id: 'c10', name: '钱萌萌', phone: '130****9900', type: 'first_visit',
    status: 'waiting', arrivalTime: offset(165), zone: 'C', floor: 3,
    intent: ['隆胸咨询'],
    isTemporary: true, queueOrder: 10, waitStartAt: offset(165),
    hasSkinTest: false, hasPhoto: false, reminders: ['等待超过30分钟'],
  },
  {
    id: 'c11', name: '马倩倩', phone: '159****1234', type: 'revisit',
    status: 'waiting', arrivalTime: offset(180), zone: 'A', floor: 1,
    intent: ['水光针补打'], consultantId: 's2',
    isTemporary: false, queueOrder: 11, waitStartAt: offset(180),
    hasSkinTest: false, hasPhoto: false, reminders: [],
  },
  {
    id: 'c12', name: '林晓晓', phone: '158****5678', type: 'first_visit',
    status: 'completed', arrivalTime: offset(-30), zone: 'D', floor: 3,
    intent: ['皮肤管理'], consultantId: 's4', doctorId: 's7',
    isTemporary: false, queueOrder: 12, waitStartAt: offset(-30),
    hasSkinTest: true, hasPhoto: true, reminders: [],
  },
]

export const mockExceptions: ExceptionEvent[] = [
  {
    id: 'e1', type: 'timeout', customerId: 'c10', customerName: '钱萌萌',
    createdAt: offset(200), resolved: false,
    details: '候诊超过30分钟未叫号',
  },
  {
    id: 'e2', type: 'temporary_leave', customerId: 'c9', customerName: '郑菲菲',
    createdAt: offset(150), resolved: false,
    details: '顾客临时离开超过15分钟未返回',
  },
  {
    id: 'e3', type: 'duplicate_checkin', customerId: 'c11', customerName: '马倩倩',
    createdAt: offset(185), resolved: true, resolvedAt: offset(186),
    details: '重复签到，已确认是复诊顾客',
    notes: '顾客忘记今天已签到过',
  },
  {
    id: 'e4', type: 'wrong_floor', customerId: 'c6', customerName: '孙丽丽',
    createdAt: offset(78), resolved: true, resolvedAt: offset(80),
    details: '顾客走到3楼，实际应在2楼B区候诊',
    notes: '已引导至正确楼层',
  },
]
