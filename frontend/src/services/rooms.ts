import axios from 'axios'
import { http } from './http'
import type { CreateRoomPayload, CreateRoomTypePayload, Room, RoomType, UpdateRoomStatusPayload } from '../types/room'

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string' && message.trim()) return message
    if (error.response?.status === 401) return '登录已失效，请重新登录'
  }
  return error instanceof Error ? error.message : '操作失败，请稍后重试'
}

export const roomApi = {
  async listRoomTypes() {
    const { data } = await http.get<RoomType[]>('/room-types')
    return data
  },
  async createRoomType(payload: CreateRoomTypePayload) {
    const { data } = await http.post<RoomType>('/room-types', payload)
    return data
  },
  async listRooms(floorNumber?: number) {
    const { data } = await http.get<Room[]>('/rooms', { params: floorNumber ? { floorNumber } : undefined })
    return data
  },
  async createRoom(payload: CreateRoomPayload) {
    const { data } = await http.post<Room>('/rooms', payload)
    return data
  },
  async updateRoomStatus(id: number, payload: UpdateRoomStatusPayload) {
    const { data } = await http.patch<Room>(`/rooms/${id}/status`, payload)
    return data
  },
}
