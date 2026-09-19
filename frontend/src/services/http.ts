import axios from 'axios'

let csrfToken = ''
let csrfHeaderName = 'X-XSRF-TOKEN'

export function setCsrfToken(token: string, headerName: string) {
  csrfToken = token
  csrfHeaderName = headerName
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 10_000,
  withCredentials: true,
  withXSRFToken: false,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase()
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    config.headers.set(csrfHeaderName, csrfToken)
  }
  return config
})
