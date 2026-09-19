import { http } from './http'
import type { AvailabilityRoom, Booking, CreateBookingPayload } from '../types/booking'

export const bookingApi = {
  async list() {
    const { data } = await http.get<Booking[]>('/bookings')
    return data
  },
  async get(id: number) {
    const { data } = await http.get<Booking>(`/bookings/${id}`)
    return data
  },
  async availability(params: { checkIn: string; checkOut: string; adults: number; children: number; roomTypeId?: number }) {
    const { data } = await http.get<AvailabilityRoom[]>('/availability', { params })
    return data
  },
  async create(payload: CreateBookingPayload) {
    const { data } = await http.post<Booking>('/bookings', payload)
    return data
  },
  async cancel(id: number, reason: string) {
    const { data } = await http.post<Booking>(`/bookings/${id}/cancel`, { reason })
    return data
  },
  async noShow(id: number, reason: string) {
    const { data } = await http.post<Booking>(`/bookings/${id}/no-show`, { reason })
    return data
  },
}
