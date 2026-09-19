import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import DashboardView from '../views/DashboardView.vue'
import RoomsView from '../views/RoomsView.vue'
import BookingsView from '../views/BookingsView.vue'
import FrontDeskView from '../views/FrontDeskView.vue'
import FinanceView from '../views/FinanceView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

export default router
