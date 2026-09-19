<script setup lang="ts">
import { reactive, watch } from 'vue'
import { Plus, X } from '@lucide/vue'
import type { CreateRoomPayload, RoomType } from '../../types/room'

const props = defineProps<{ open: boolean; submitting: boolean; roomTypes: RoomType[] }>()
const emit = defineEmits<{ close: []; submit: [payload: CreateRoomPayload] }>()
const form = reactive({ roomTypeId: 0, roomNumber: '', floorNumber: 7, notes: '' })

watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(form, { roomTypeId: props.roomTypes.find((item) => item.active)?.id ?? 0, roomNumber: '', floorNumber: 7, notes: '' })
})

function submit() {
  emit('submit', { ...form, notes: form.notes || undefined })
}
</script>

<template>
  <div v-if="open" class="modal-overlay" @click.self="emit('close')">
    <form class="app-modal" @submit.prevent="submit">
      <header class="app-modal-head"><div><span>基础资料</span><h2>新增房间</h2></div><button type="button" aria-label="关闭" @click="emit('close')"><X :size="18" /></button></header>
      <div class="app-modal-body form-grid">
        <label class="wide"><span>所属房型</span><select v-model.number="form.roomTypeId" required><option disabled :value="0">请选择房型</option><option v-for="type in roomTypes.filter((item) => item.active)" :key="type.id" :value="type.id">{{ type.code }} · {{ type.name }} · ¥{{ type.defaultRate }}</option></select></label>
        <label><span>房号</span><input v-model.trim="form.roomNumber" required maxlength="20" placeholder="例如 701" /></label>
        <label><span>楼层</span><input v-model.number="form.floorNumber" type="number" min="1" max="99" required /></label>
        <label class="wide"><span>备注</span><textarea v-model.trim="form.notes" maxlength="500" placeholder="房间属性或注意事项"></textarea></label>
      </div>
      <footer class="app-modal-foot"><button class="secondary-button" type="button" @click="emit('close')">取消</button><button class="primary-button" type="submit" :disabled="submitting || roomTypes.length === 0"><Plus :size="15" />{{ submitting ? '正在保存…' : '创建房间' }}</button></footer>
    </form>
  </div>
</template>
