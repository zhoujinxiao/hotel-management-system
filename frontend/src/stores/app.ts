import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    hotelName: '云栖酒店',
    branchName: '湖滨店',
    operatorName: '林知夏',
    shiftName: '白班',
    shiftStartedAt: '08:00',
    systemHealthy: true,
  }),
})
