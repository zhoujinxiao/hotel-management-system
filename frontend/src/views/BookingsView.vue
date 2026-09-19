<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { CalendarDays, Plus, RefreshCcw, Search, X } from '@lucide/vue'
import { bookingApi } from '../services/bookings'
import { getApiErrorMessage } from '../services/rooms'
import type { AvailabilityRoom, Booking, BookingSource, BookingStatus, CreateBookingPayload, GuaranteeStatus } from '../types/booking'

const bookings = ref<Booking[]>([])
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const notice = ref('')
const search = ref('')
const statusFilter = ref<'ALL' | BookingStatus>('ALL')
const modalOpen = ref(false)
const availability = ref<AvailabilityRoom[]>([])
const availabilityLoading = ref(false)

const today = new Date()
const tomorrow = new Date(today.getTime() + 86400000)
const dayAfter = new Date(today.getTime() + 2 * 86400000)
const toDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const form = reactive<CreateBookingPayload>({
  guestName: '', phone: '', city: '', roomId: 0,
  checkIn: toDate(tomorrow), checkOut: toDate(dayAfter), adults: 2, children: 0,
  source: 'PHONE', guaranteeStatus: 'NOT_GUARANTEED', notes: '',
})

const statusLabels: Record<BookingStatus, string> = { CONFIRMED: '已确认', CHECKED_IN: '在住', COMPLETED: '已完成', CANCELED: '已取消', NO_SHOW: '未到店' }
const sourceLabels: Record<BookingSource, string> = { WALK_IN: '到店', PHONE: '电话', WECHAT: '微信' }
const guaranteeLabels: Record<GuaranteeStatus, string> = { GUARANTEED: '已担保', NOT_GUARANTEED: '未担保' }
const filteredBookings = computed(() => bookings.value.filter((booking) => {
  const statusMatches = statusFilter.value === 'ALL' || booking.status === statusFilter.value
  const text = `${booking.bookingNo} ${booking.guestName} ${booking.roomNumber} ${booking.phoneLast4}`.toLowerCase()
  return statusMatches && (!search.value.trim() || text.includes(search.value.trim().toLowerCase()))
}))
const selectedAvailability = computed(() => availability.value.find((room) => room.roomId === form.roomId) ?? null)

function showNotice(message: string) { notice.value = message; window.setTimeout(() => { notice.value = '' }, 3000) }
async function loadBookings() {
  loading.value = true
  errorMessage.value = ''
  try { bookings.value = await bookingApi.list() }
  catch (error) { errorMessage.value = getApiErrorMessage(error) }
  finally { loading.value = false }
}
async function loadAvailability() {
  if (!form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) { availability.value = []; return }
  availabilityLoading.value = true
  try {
    availability.value = await bookingApi.availability({ checkIn: form.checkIn, checkOut: form.checkOut, adults: form.adults, children: form.children })
    if (!availability.value.some((room) => room.roomId === form.roomId)) form.roomId = availability.value[0]?.roomId ?? 0
  } catch (error) { errorMessage.value = getApiErrorMessage(error) }
  finally { availabilityLoading.value = false }
}
function openCreate() {
  Object.assign(form, { guestName: '', phone: '', city: '', roomId: 0, checkIn: toDate(tomorrow), checkOut: toDate(dayAfter), adults: 2, children: 0, source: 'PHONE', guaranteeStatus: 'NOT_GUARANTEED', notes: '' })
  modalOpen.value = true
  loadAvailability()
}
async function createBooking() {
  if (!form.roomId) { errorMessage.value = '请选择可用房间'; return }
  submitting.value = true
  try {
    await bookingApi.create({ ...form })
    modalOpen.value = false
    await loadBookings()
    showNotice('预订已创建')
  } catch (error) { errorMessage.value = getApiErrorMessage(error) }
  finally { submitting.value = false }
}
async function changeStatus(booking: Booking, action: 'cancel' | 'no-show') {
  const reason = window.prompt(action === 'cancel' ? '请输入取消原因' : '请输入未到店原因')
  if (!reason?.trim()) return
  try {
    if (action === 'cancel') await bookingApi.cancel(booking.id, reason.trim())
    else await bookingApi.noShow(booking.id, reason.trim())
    await loadBookings()
    showNotice(action === 'cancel' ? '预订已取消' : '已标记未到店')
  } catch (error) { errorMessage.value = getApiErrorMessage(error) }
}
watch(() => [form.checkIn, form.checkOut, form.adults, form.children], loadAvailability)
onMounted(loadBookings)
</script>

<template>
  <section class="booking-page">
    <header class="page-heading">
      <div><p class="page-kicker">直订 · 到店 · 电话 · 微信</p><h1>预订管理</h1><p>一笔订单对应一间房，数据库房晚库存负责最终冲突校验。</p></div>
      <div class="heading-actions"><button class="secondary-button" type="button" @click="loadBookings"><RefreshCcw :size="15" />刷新</button><button class="primary-button" type="button" @click="openCreate"><Plus :size="15" />新建预订</button></div>
    </header>
    <div v-if="errorMessage" class="page-alert" role="alert"><span>{{ errorMessage }}</span><button type="button" @click="errorMessage = ''">关闭</button></div>
    <div v-if="notice" class="page-notice" role="status">{{ notice }}</div>
    <div class="booking-toolbar"><label class="topbar-search"><Search :size="16" /><input v-model="search" placeholder="订单号、宾客、房号或手机号后四位" /></label><div class="filter-pills"><button :class="{ active: statusFilter === 'ALL' }" type="button" @click="statusFilter = 'ALL'">全部</button><button v-for="(label, value) in statusLabels" :key="value" :class="{ active: statusFilter === value }" type="button" @click="statusFilter = value">{{ label }}</button></div></div>
    <section class="panel booking-panel">
      <div v-if="loading" class="catalog-loading"><RefreshCcw :size="20" />正在读取预订…</div>
      <div v-else-if="filteredBookings.length === 0" class="catalog-empty"><CalendarDays :size="28" /><h2>还没有预订</h2><p>创建第一笔直订后，订单会显示在这里。</p><button class="primary-button" type="button" @click="openCreate">新建预订</button></div>
      <div v-else class="table-wrap"><table class="app-table booking-table"><thead><tr><th>订单</th><th>宾客</th><th>房间</th><th>入住日期</th><th>来源</th><th>担保</th><th>状态</th><th>金额</th><th /></tr></thead><tbody><tr v-for="booking in filteredBookings" :key="booking.id"><td class="mono">{{ booking.bookingNo }}</td><td><strong>{{ booking.guestName }}</strong><small class="table-sub">尾号 {{ booking.phoneLast4 }}</small></td><td><strong>{{ booking.roomNumber }}</strong><small class="table-sub">{{ booking.roomTypeName }}</small></td><td>{{ booking.checkIn }} → {{ booking.checkOut }}</td><td>{{ sourceLabels[booking.source] }}</td><td>{{ guaranteeLabels[booking.guaranteeStatus] }}</td><td><span :class="['booking-status', booking.status.toLowerCase()]">{{ statusLabels[booking.status] }}</span></td><td class="mono">¥{{ Number(booking.totalAmount).toFixed(2) }}</td><td class="booking-actions"><template v-if="booking.status === 'CONFIRMED'"><button type="button" @click="changeStatus(booking, 'cancel')">取消</button><button type="button" @click="changeStatus(booking, 'no-show')">未到店</button></template><span v-else>—</span></td></tr></tbody></table></div>
    </section>
    <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
      <form class="app-modal booking-modal" @submit.prevent="createBooking">
        <header class="app-modal-head"><div><span>前台业务</span><h2>新建预订</h2></div><button type="button" aria-label="关闭" @click="modalOpen = false"><X :size="18" /></button></header>
        <div class="app-modal-body booking-form">
          <section><h3>宾客信息</h3><div class="form-grid"><label><span>姓名</span><input v-model.trim="form.guestName" required /></label><label><span>手机号</span><input v-model.trim="form.phone" inputmode="tel" required /></label><label class="wide"><span>常住城市</span><input v-model.trim="form.city" /></label></div></section>
          <section><h3>入住信息</h3><div class="form-grid"><label><span>到店日期</span><input v-model="form.checkIn" type="date" required /></label><label><span>离店日期</span><input v-model="form.checkOut" type="date" required /></label><label><span>成人数</span><input v-model.number="form.adults" type="number" min="1" /></label><label><span>儿童数</span><input v-model.number="form.children" type="number" min="0" /></label><label class="wide"><span>可用房间</span><select v-model.number="form.roomId" required><option disabled :value="0">{{ availabilityLoading ? '正在查询…' : '请选择房间' }}</option><option v-for="room in availability" :key="room.roomId" :value="room.roomId">{{ room.roomNumber }} · {{ room.roomTypeName }} · ¥{{ Number(room.totalAmount).toFixed(2) }}</option></select></label></div></section>
          <section><h3>预订属性</h3><div class="form-grid"><label><span>来源</span><select v-model="form.source"><option value="PHONE">电话</option><option value="WECHAT">微信</option><option value="WALK_IN">到店</option></select></label><label><span>担保状态</span><select v-model="form.guaranteeStatus"><option value="NOT_GUARANTEED">未担保</option><option value="GUARANTEED">已担保</option></select></label><label class="wide"><span>备注</span><textarea v-model.trim="form.notes" /></label></div></section>
          <div v-if="selectedAvailability" class="booking-total"><span>{{ selectedAvailability.roomNumber }} · {{ selectedAvailability.nightlyRates.length }} 晚</span><strong>¥{{ Number(selectedAvailability.totalAmount).toFixed(2) }}</strong></div>
        </div>
        <footer class="app-modal-foot"><button class="secondary-button" type="button" @click="modalOpen = false">取消</button><button class="primary-button" type="submit" :disabled="submitting || !form.roomId">{{ submitting ? '正在创建…' : '确认预订' }}</button></footer>
      </form>
    </div>
  </section>
</template>

<style scoped>
.booking-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.booking-panel { min-height: 300px; }
.booking-table { min-width: 1050px; }
.table-sub { display: block; margin-top: 2px; color: var(--muted); font-size: 8px; font-weight: 400; }
.booking-status { display: inline-flex; padding: 2px 7px; border-radius: 99px; color: #7b633a; background: #f2e6ca; font-size: 8px; }
.booking-status.canceled, .booking-status.no_show { color: #875043; background: #f1dfda; }
.booking-status.checked_in { color: #285b4d; background: #dce9e3; }
.booking-status.completed { color: #5c625f; background: #e9e7e0; }
.booking-actions { display: flex; justify-content: flex-end; gap: 5px; }
.booking-actions button { padding: 4px 7px; border-radius: 5px; color: #7e4c3f; background: #f3e2dd; font-size: 8px; }
.booking-modal { width: min(760px, 100%); }
.booking-form { display: grid; gap: 18px; }
.booking-form section h3 { margin: 0 0 10px; font: 700 15px "STZhongsong", serif; }
.booking-total { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid #ddc79e; border-radius: 9px; color: #6f5835; background: #f8efdd; font-size: 10px; }
.booking-total strong { color: #a05d29; font: 19px Consolas, monospace; }
</style>
