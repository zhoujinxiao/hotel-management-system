import { defineStore } from 'pinia'
import { http } from '../services/http'
import type { CurrentUser } from '../types/auth'

interface LoginPayload {
  username: string
  password: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as CurrentUser | null,
    initialized: false,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    hasPermission: (state) => (permission: string) => state.user?.permissions.includes(permission) ?? false,
  },
  actions: {
    async fetchMe() {
      if (this.loading) return
      this.loading = true
      try {
        const { data } = await http.get<CurrentUser>('/auth/me')
        this.user = data
      } catch {
        this.user = null
      } finally {
        this.initialized = true
        this.loading = false
      }
    },
    async login(payload: LoginPayload) {
      await http.get('/auth/csrf')
      const { data } = await http.post<CurrentUser>('/auth/login', payload)
      this.user = data
      this.initialized = true
      return data
    },
    async logout() {
      await http.post('/auth/logout')
      this.user = null
      this.initialized = true
    },
  },
})
