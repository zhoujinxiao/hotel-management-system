<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BedDouble, Building2, Plus, RefreshCcw, Search } from '@lucide/vue'
import RoomModal from '../components/rooms/RoomModal.vue'
import RoomStatusDrawer from '../components/rooms/RoomStatusDrawer.vue'
import RoomTypeModal from '../components/rooms/RoomTypeModal.vue'
import { getApiErrorMessage, roomApi } from '../services/rooms'
import type { CreateRoomPayload, CreateRoomTypePayload, Room, RoomType, UpdateRoomStatusPayload } from '../types/room'

const rooms = ref<Room[]>([])
const roomTypes = ref<RoomType[]>([])
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const notice = ref('')
const activeTab = ref<'rooms' | 'types'>('rooms')
const selectedFloor = ref<number | 'all'>('all')
const selectedOccupancy = ref<'all' | Room['occupancyStatus']>('all')
const selectedRoom = ref<Room | null>(null)
const roomTypeModalOpen = ref(false)
const roomModalOpen = ref(false)

const occupiedCount = computed(() => rooms.value.filter((room) => room.occupancyStatus === 'OCCUPIED').length)
const availableCount = computed(() => rooms.value.filter((room) => room.occupancyStatus === 'VACANT' && room.cleanlinessStatus === 'INSPECTED' && room.usabilityStatus === 'USABLE').length)
const cleaningCount = computed(() => rooms.value.filter((room) => room.cleanlinessStatus !== 'INSPECTED').length)
const outOfOrderCount = computed(() => rooms.value.filter((room) => room.usabilityStatus === 'OUT_OF_ORDER').length)
const floors = computed(() => [...new Set(rooms.value.map((room) => room.floorNumber))].sort((a, b) => a - b))
const filteredRooms = computed(() => rooms.value.filter((room) => {
  const floorMatches = selectedFloor.value === 'all' || room.floorNumber === selectedFloor.value
  const statusMatches = selectedOccupancy.value === 'all' || room.occupancyStatus === selectedOccupancy.value
  return floorMatches && statusMatches
}))
const groupedRooms = computed(() => floors.value.map((floor) => ({ floor, rooms: filteredRooms.value.filter((room) => room.floorNumber === floor) })).filter((group) => group.rooms.length))

const occupancyLabels: Record<Room['occupancyStatus'], string> = { VACANT: '空闲', RESERVED: '已锁定', OCCUPIED: '在住' }
const cleanlinessLabels: Record<Room['cleanlinessStatus'], string> = { DIRTY: '待清洁', CLEAN: '已清洁', INSPECTED: '已查房' }
const usabilityLabels: Record<Room['usabilityStatus'], string> = { USABLE: '可用', OUT_OF_ORDER: '停用' }

function showNotice(message: string) {
  notice.value = message
  window.setTimeout(() => { notice.value = '' }, 3000)
}

async function loadCatalog() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [roomTypeData, roomData] = await Promise.all([roomApi.listRoomTypes(), roomApi.listRooms()])
    roomTypes.value = roomTypeData
    rooms.value = roomData
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function createRoomType(payload: CreateRoomTypePayload) {
  submitting.value = true
  try {
    await roomApi.createRoomType(payload)
    roomTypeModalOpen.value = false
    await loadCatalog()
    showNotice('房型已创建')
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

async function createRoom(payload: CreateRoomPayload) {
  submitting.value = true
  try {
    await roomApi.createRoom(payload)
    roomModalOpen.value = false
    await loadCatalog()
    showNotice('房间已创建')
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

async function updateRoomStatus(payload: UpdateRoomStatusPayload) {
  if (!selectedRoom.value) return
  submitting.value = true
  try {
    const updated = await roomApi.updateRoomStatus(selectedRoom.value.id, payload)
    const index = rooms.value.findIndex((room) => room.id === updated.id)
    if (index >= 0) rooms.value[index] = updated
    selectedRoom.value = updated
    showNotice('房态已更新')
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

onMounted(loadCatalog)
</script>

<template>
  <section class="room-catalog-page">
    <header class="page-heading">
      <div><p class="page-kicker">4 个楼层 · {{ rooms.length }} 间房</p><h1>房态中心</h1><p>房型、房间和三维房态统一维护，数据库负责最终冲突校验。</p></div>
      <div class="heading-actions">
        <button class="secondary-button" type="button" :disabled="loading" @click="loadCatalog"><RefreshCcw :size="15" />刷新</button>
        <button class="secondary-button" type="button" @click="roomTypeModalOpen = true"><Building2 :size="15" />新增房型</button>
        <button class="primary-button" type="button" @click="roomModalOpen = true"><Plus :size="15" />新增房间</button>
      </div>
    </header>

    <div v-if="errorMessage" class="page-alert" role="alert"><span>{{ errorMessage }}</span><button type="button" @click="errorMessage = ''">关闭</button></div>
    <div v-if="notice" class="page-notice" role="status">{{ notice }}</div>

    <section class="room-summary">
      <article><span>房间总数</span><strong>{{ rooms.length }}</strong><small>按门店全部房间</small></article>
      <article><span>在住</span><strong>{{ occupiedCount }}</strong><small>占用状态 OCCUPIED</small></article>
      <article><span>当前可售</span><strong>{{ availableCount }}</strong><small>空闲 + 已查房 + 可用</small></article>
      <article><span>待清洁 / 查房</span><strong>{{ cleaningCount }}</strong><small>未达到 INSPECTED</small></article>
      <article><span>停用维修</span><strong>{{ outOfOrderCount }}</strong><small>不参与可售库存</small></article>
    </section>

    <div class="catalog-tabs" role="tablist"><button :class="{ active: activeTab === 'rooms' }" type="button" @click="activeTab = 'rooms'">房间与房态</button><button :class="{ active: activeTab === 'types' }" type="button" @click="activeTab = 'types'">房型设置</button></div>

    <template v-if="activeTab === 'rooms'">
      <div class="room-toolbar">
        <div class="filter-pills"><button :class="{ active: selectedFloor === 'all' }" type="button" @click="selectedFloor = 'all'">全部楼层</button><button v-for="floor in floors" :key="floor" :class="{ active: selectedFloor === floor }" type="button" @click="selectedFloor = floor">{{ floor }}F</button></div>
        <div class="filter-pills"><button :class="{ active: selectedOccupancy === 'all' }" type="button" @click="selectedOccupancy = 'all'">全部占用</button><button v-for="(label, value) in occupancyLabels" :key="value" :class="{ active: selectedOccupancy === value }" type="button" @click="selectedOccupancy = value">{{ label }}</button></div>
      </div>

      <div v-if="loading" class="catalog-loading"><RefreshCcw :size="20" />正在读取房态…</div>
      <div v-else-if="rooms.length === 0" class="catalog-empty"><BedDouble :size="28" /><h2>还没有房间</h2><p>先创建房型，再录入 40 间房。</p><button class="primary-button" type="button" @click="roomTypeModalOpen = true">新增房型</button></div>
      <div v-else class="room-floor-list">
        <section v-for="group in groupedRooms" :key="group.floor" class="room-floor-group">
          <header><h2>{{ group.floor }} 楼</h2><span>{{ group.rooms.length }} 间 · {{ group.rooms.filter((room) => room.occupancyStatus === 'OCCUPIED').length }} 间在住</span></header>
          <div class="room-card-grid">
            <button v-for="room in group.rooms" :key="room.id" class="catalog-room-card" :class="[room.occupancyStatus.toLowerCase(), room.cleanlinessStatus.toLowerCase(), room.usabilityStatus.toLowerCase()]" type="button" @click="selectedRoom = room">
              <span class="room-card-title">{{ room.roomNumber }}<b>{{ occupancyLabels[room.occupancyStatus] }}</b></span>
              <small>{{ room.roomTypeName }}</small>
              <span class="room-card-state"><i>{{ cleanlinessLabels[room.cleanlinessStatus] }}</i><i>{{ usabilityLabels[room.usabilityStatus] }}</i></span>
            </button>
          </div>
        </section>
        <div v-if="groupedRooms.length === 0" class="catalog-empty compact"><Search :size="24" /><h2>没有符合条件的房间</h2><p>调整楼层或占用状态筛选。</p></div>
      </div>
    </template>

    <template v-else>
      <section class="data-panel room-type-panel">
        <div class="table-wrap">
          <table class="app-table">
            <thead><tr><th>编码</th><th>房型</th><th>床型</th><th>标准 / 最大入住</th><th>默认房价</th><th>状态</th></tr></thead>
            <tbody>
              <tr v-for="type in roomTypes" :key="type.id"><td class="mono">{{ type.code }}</td><td><strong>{{ type.name }}</strong></td><td>{{ type.bedType }}</td><td>{{ type.standardOccupancy }} / {{ type.maxOccupancy }} 人</td><td class="mono">¥{{ Number(type.defaultRate).toFixed(2) }}</td><td><span :class="['type-status', { active: type.active }]">{{ type.active ? '启用' : '停用' }}</span></td></tr>
              <tr v-if="roomTypes.length === 0"><td colspan="6" class="empty-cell">还没有房型，先创建房型再录入房间。</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <RoomTypeModal :open="roomTypeModalOpen" :submitting="submitting" @close="roomTypeModalOpen = false" @submit="createRoomType" />
    <RoomModal :open="roomModalOpen" :submitting="submitting" :room-types="roomTypes" @close="roomModalOpen = false" @submit="createRoom" />
    <RoomStatusDrawer :room="selectedRoom" :submitting="submitting" @close="selectedRoom = null" @update="updateRoomStatus" />
  </section>
</template>

<style scoped>
.room-catalog-page { min-width: 0; }
.page-alert, .page-notice { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 11px 13px; border-radius: 10px; font-size: 11px; }
.page-alert { color: #8f4133; border: 1px solid #e3b3a8; background: #f8e5e0; }
.page-alert button { color: inherit; background: transparent; font-size: 10px; }
.page-notice { color: #285a4b; border: 1px solid #bad0c6; background: #e6f0eb; }
.room-summary { display: grid; grid-template-columns: repeat(5, 1fr); margin-bottom: 15px; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); overflow: hidden; }
.room-summary article { min-height: 94px; padding: 16px 17px; border-left: 1px solid var(--line); }
.room-summary article:first-child { border-left: 0; }
.room-summary span, .room-summary small { display: block; color: var(--muted); font-size: 9px; }
.room-summary strong { display: block; margin: 7px 0 4px; font: 27px/1 Consolas, monospace; }
.catalog-tabs { display: flex; gap: 3px; margin-bottom: 14px; border-bottom: 1px solid var(--line); }
.catalog-tabs button { position: relative; min-height: 42px; padding: 0 17px; color: var(--muted); background: transparent; font-size: 11px; }
.catalog-tabs button.active { color: var(--pine-2); font-weight: 700; }
.catalog-tabs button.active::after { content: ""; position: absolute; left: 10px; right: 10px; bottom: -1px; height: 2px; background: var(--pine-2); }
.room-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.filter-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.filter-pills button { min-height: 34px; padding: 0 11px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); background: rgba(255,253,248,.72); font-size: 10px; }
.filter-pills button.active { color: #fff; border-color: var(--pine-2); background: var(--pine-2); }
.catalog-loading, .catalog-empty { display: grid; place-items: center; align-content: center; min-height: 260px; gap: 8px; border: 1px solid var(--line); border-radius: 13px; color: var(--muted); background: var(--surface); text-align: center; }
.catalog-empty h2 { margin: 5px 0 0; color: var(--ink); font: 700 18px "STZhongsong", serif; }
.catalog-empty p { margin: 0 0 8px; font-size: 10px; }
.catalog-empty.compact { min-height: 140px; }
.room-floor-list { display: grid; gap: 19px; }
.room-floor-group > header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.room-floor-group h2 { margin: 0; font: 700 17px "STZhongsong", serif; }
.room-floor-group header span { color: var(--muted); font-size: 9px; }
.room-card-grid { display: grid; grid-template-columns: repeat(8, minmax(92px, 1fr)); gap: 8px; }
.catalog-room-card { display: flex; flex-direction: column; min-height: 108px; padding: 11px; border: 1px solid var(--line); border-top: 4px solid #8eb39c; border-radius: 10px; background: var(--surface); text-align: left; transition: transform .15s ease, border-color .15s ease; }
.catalog-room-card:hover { transform: translateY(-2px); border-color: #9da9a2; }
.catalog-room-card.occupied { border-top-color: var(--pine-2); background: #f6faf8; }
.catalog-room-card.reserved { border-top-color: var(--gold); background: #fffbf3; }
.catalog-room-card.dirty { border-top-color: var(--blue); background: #f6fafb; }
.catalog-room-card.out_of_order { border-top-color: #77736d; background: #f3f2ee; }
.room-card-title { display: flex; align-items: center; justify-content: space-between; font: 17px Consolas, monospace; }
.room-card-title b { padding: 2px 5px; border-radius: 99px; color: #2a6454; background: #dce9e3; font: 8px "Microsoft YaHei UI", sans-serif; }
.catalog-room-card small { margin-top: 7px; color: var(--muted); font-size: 8px; }
.room-card-state { display: flex; flex-wrap: wrap; gap: 5px; margin-top: auto; padding-top: 9px; }
.room-card-state i { padding: 2px 5px; border-radius: 4px; color: #656d68; background: #efede7; font: normal 8px "Microsoft YaHei UI", sans-serif; }
.room-type-panel { padding-bottom: 0; }
.table-wrap { overflow-x: auto; }
.app-table { width: 100%; border-collapse: collapse; }
.app-table th, .app-table td { padding: 13px 15px; border-bottom: 1px solid var(--line); text-align: left; white-space: nowrap; }
.app-table th { color: var(--muted); background: #f0eee7; font-size: 9px; font-weight: 500; }
.app-table td { font-size: 11px; }
.app-table tbody tr:last-child td { border-bottom: 0; }
.app-table .mono { font-family: Consolas, monospace; }
.empty-cell { padding: 45px !important; color: var(--muted); text-align: center !important; }
.type-status { display: inline-flex; padding: 2px 7px; border-radius: 99px; color: #707873; background: #e9e7e0; font-size: 8px; }
.type-status.active { color: #2a6454; background: #dce9e3; }
</style>
