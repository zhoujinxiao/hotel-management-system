import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppShell from '../layouts/AppShell.vue'
import DashboardView from '../views/DashboardView.vue'
import RoomsView from '../views/RoomsView.vue'
import BookingsView from '../views/BookingsView.vue'
import FrontDeskView from '../views/FrontDeskView.vue'
import FinanceView from '../views/FinanceView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true, title: '登录' } },
    {
      path: '/',
      component: AppShell,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: DashboardView, meta: { title: '值班控制台' } },
        { path: 'rooms', name: 'rooms', component: RoomsView, meta: { title: '房态中心' } },
        { path: 'bookings', name: 'bookings', component: BookingsView, meta: { title: '预订管理' } },
        { path: 'frontdesk', name: 'frontdesk', component: FrontDeskView, meta: { title: '入住与退房' } },
        { path: 'finance', name: 'finance', component: FinanceView, meta: { title: '账单与班次' } },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.fetchMe()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' }
  return true
})

export default router
