export type OccupancyStatus = 'VACANT' | 'RESERVED' | 'OCCUPIED'
export type CleanlinessStatus = 'DIRTY' | 'CLEAN' | 'INSPECTED'
export type UsabilityStatus = 'USABLE' | 'OUT_OF_ORDER'

export interface RoomType {
  id: number
  code: string
  name: string
  bedType: string
  standardOccupancy: number
  maxOccupancy: number
  defaultRate: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Room {
  id: number
  roomTypeId: number
  roomTypeCode: string
  roomTypeName: string
  roomNumber: string
  floorNumber: number
  occupancyStatus: OccupancyStatus
  cleanlinessStatus: CleanlinessStatus
  usabilityStatus: UsabilityStatus
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateRoomTypePayload {
  code: string
  name: string
  bedType: string
  standardOccupancy: number
  maxOccupancy: number
  defaultRate: number
}

export interface CreateRoomPayload {
  roomTypeId: number
  roomNumber: string
  floorNumber: number
  notes?: string
}

export interface UpdateRoomStatusPayload {
  occupancyStatus?: OccupancyStatus
  cleanlinessStatus?: CleanlinessStatus
  usabilityStatus?: UsabilityStatus
}
