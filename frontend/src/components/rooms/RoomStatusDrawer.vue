<script setup lang="ts">
import { reactive, watch } from 'vue'
import { Save, X } from '@lucide/vue'
import type { Room, UpdateRoomStatusPayload } from '../../types/room'

const props = defineProps<{ room: Room | null; submitting: boolean }>()
const emit = defineEmits<{ close: []; update: [payload: UpdateRoomStatusPayload] }>()
const form = reactive<UpdateRoomStatusPayload>({ occupancyStatus: 'VACANT', cleanlinessStatus: 'DIRTY', usabilityStatus: 'USABLE' })

watch(() => props.room, (room) => {
  if (!room) return
  Object.assign(form, { occupancyStatus: room.occupancyStatus, cleanlinessStatus: room.cleanlinessStatus, usabilityStatus: room.usabilityStatus })
}, { immediate: true })

const statusText = {
  VACANT: '空闲', RESERVED: '已锁定', OCCUPIED: '在住',
  DIRTY: '待清洁', CLEAN: '已清洁', INSPECTED: '已查房',
  USABLE: '可正常使用', OUT_OF_ORDER: '停用维修',
}
</script>

<template>
  <div v-if="room" class="drawer-overlay" @click.self="emit('close')">
    <aside class="room-drawer">
      <header class="drawer-head"><div><span>房间详情</span><h2>{{ room.roomNumber }}</h2><p>{{ room.floorNumber }} 楼 · {{ room.roomTypeName }}</p></div><button type="button" aria-label="关闭" @click="emit('close')"><X :size="18" /></button></header>
      <div class="drawer-body">
        <section class="drawer-section"><h3>三维房态</h3><p class="drawer-help">占用、清洁和可用状态分别维护，不合并为单一状态。</p><div class="status-form">
          <label><span>占用状态</span><select v-model="form.occupancyStatus"><option v-for="(label, value) in { VACANT: statusText.VACANT, RESERVED: statusText.RESERVED, OCCUPIED: statusText.OCCUPIED }" :key="value" :value="value">{{ label }}</option></select></label>
          <label><span>清洁状态</span><select v-model="form.cleanlinessStatus"><option v-for="(label, value) in { DIRTY: statusText.DIRTY, CLEAN: statusText.CLEAN, INSPECTED: statusText.INSPECTED }" :key="value" :value="value">{{ label }}</option></select></label>
          <label><span>可用状态</span><select v-model="form.usabilityStatus"><option v-for="(label, value) in { USABLE: statusText.USABLE, OUT_OF_ORDER: statusText.OUT_OF_ORDER }" :key="value" :value="value">{{ label }}</option></select></label>
        </div></section>
        <section class="drawer-section"><h3>可售判断</h3><div :class="['sellability-box', form.cleanlinessStatus === 'INSPECTED' && form.usabilityStatus === 'USABLE' && form.occupancyStatus === 'VACANT' ? 'is-ready' : 'is-blocked']">
          <strong>{{ form.cleanlinessStatus === 'INSPECTED' && form.usabilityStatus === 'USABLE' && form.occupancyStatus === 'VACANT' ? '当前可售' : '当前不可售' }}</strong>
          <span>需同时满足空闲、已查房和可正常使用；具体日期占用仍由预订库存校验。</span>
        </div></section>
        <section v-if="room.notes" class="drawer-section"><h3>房间备注</h3><p>{{ room.notes }}</p></section>
      </div>
      <footer class="drawer-foot"><button class="secondary-button" type="button" @click="emit('close')">关闭</button><button class="primary-button" type="button" :disabled="submitting" @click="emit('update', { ...form })"><Save :size="15" />{{ submitting ? '正在保存…' : '保存房态' }}</button></footer>
    </aside>
  </div>
</template>
