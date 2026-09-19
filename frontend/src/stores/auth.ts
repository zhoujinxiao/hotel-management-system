import { defineStore } from 'pinia'
import { http, setCsrfToken } from '../services/http'
import type { CurrentUser } from '../types/auth'

interface LoginPayload {
  username: string
  password: string
}

interface CsrfResponse {
  token: string
  headerName: string
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
    async ensureCsrfToken() {
      const { data } = await http.get<CsrfResponse>('/auth/csrf')
      setCsrfToken(data.token, data.headerName)
      return data.token
    },
    async fetchMe() {
      if (this.loading) return
      this.loading = true
      try {
        await this.ensureCsrfToken()
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
      await this.ensureCsrfToken()
      const { data } = await http.post<CurrentUser>('/auth/login', payload)
      this.user = data
      this.initialized = true
      return data
    },
    async logout() {
      await this.ensureCsrfToken()
      await http.post('/auth/logout')
      this.user = null
      this.initialized = true
    },
  },
})
