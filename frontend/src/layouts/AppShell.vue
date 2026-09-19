<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import {
  BedDouble,
  Bell,
  CalendarDays,
  DoorOpen,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Search,
  Users,
} from '@lucide/vue'
import { useAppStore } from '../stores/app'

const app = useAppStore()
const route = useRoute()

const navItems = [
  { to: '/dashboard', label: '值班台', icon: LayoutDashboard },
  { to: '/bookings', label: '预订管理', icon: CalendarDays },
  { to: '/rooms', label: '房态中心', icon: BedDouble },
  { to: '/frontdesk', label: '入住 / 退房', icon: DoorOpen },
  { to: '/finance', label: '账单与班次', icon: ReceiptText },
  { to: '/guests', label: '宾客档案', icon: Users, disabled: true },
]

const pageTitle = computed(() => String(route.meta.title ?? '运营台'))
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand">
        <span class="brand-mark">云</span>
        <div>
          <strong>{{ app.hotelName }}</strong>
          <small>{{ app.branchName }} · 运营台</small>
        </div>
      </div>

      <nav class="app-nav" aria-label="主要导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.disabled ? route.fullPath : item.to"
          class="nav-item"
          :class="{ 'is-disabled': item.disabled }"
          :aria-disabled="item.disabled"
        >
          <component :is="item.icon" :size="17" :stroke-width="1.8" />
          <span>{{ item.label }}</span>
          <span v-if="item.disabled" class="nav-soon">后续</span>
        </RouterLink>
      </nav>

      <div class="shift-card">
        <span class="status-dot" />
        <div>
          <strong>{{ app.shiftName }} · {{ app.shiftStartedAt }}</strong>
          <small>本班次数据已同步</small>
        </div>
      </div>

      <div class="operator-card">
        <span class="avatar">{{ app.operatorName.slice(0, 1) }}</span>
        <div>
          <strong>{{ app.operatorName }}</strong>
          <small>前台值班</small>
        </div>
      </div>
    </aside>

    <div class="app-main">
      <header class="app-topbar">
        <div class="topbar-title">
          <span class="health-dot" />
          <span>系统运行正常</span>
          <span class="topbar-separator" />
          <strong>{{ pageTitle }}</strong>
        </div>
        <div class="topbar-actions">
          <label class="topbar-search">
            <Search :size="16" />
            <input placeholder="姓名、手机号、订单号或房号" />
          </label>
          <button class="icon-button" type="button" aria-label="通知">
            <Bell :size="18" />
          </button>
          <button class="primary-button" type="button">
            <Plus :size="16" />
            新建预订
          </button>
        </div>
      </header>

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
