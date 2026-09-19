export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'
export type BookingSource = 'WALK_IN' | 'PHONE' | 'WECHAT'
export type GuaranteeStatus = 'GUARANTEED' | 'NOT_GUARANTEED'

export interface Booking {
  id: number
  bookingNo: string
  guestName: string
  phoneLast4: string
  roomNumber: string
  roomTypeName: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  status: BookingStatus
  source: BookingSource
  guaranteeStatus: GuaranteeStatus
  rate: number
  totalAmount: number
  taxRate: number
  taxAmount: number
  netAmount: number
  notes?: string
  createdAt?: string
}

export interface NightlyRate {
  date: string
  rate: number
}

export interface AvailabilityRoom {
  roomId: number
  roomNumber: string
  floorNumber: number
  roomTypeId: number
  roomTypeCode: string
  roomTypeName: string
  maxOccupancy: number
  totalAmount: number
  nightlyRates: NightlyRate[]
}

export interface CreateBookingPayload {
  guestName: string
  phone: string
  city?: string
  roomId: number
  checkIn: string
  checkOut: string
  adults: number
  children: number
  source: BookingSource
  guaranteeStatus: GuaranteeStatus
  notes?: string
}
