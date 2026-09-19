<script setup lang="ts">
import { reactive, watch } from 'vue'
import { Plus, X } from '@lucide/vue'
import type { CreateRoomTypePayload } from '../../types/room'

const props = defineProps<{ open: boolean; submitting: boolean }>()
const emit = defineEmits<{ close: []; submit: [payload: CreateRoomTypePayload] }>()
const form = reactive({ code: '', name: '', bedType: '', standardOccupancy: 2, maxOccupancy: 2, defaultRate: 100 })

watch(() => props.open, (open) => {
  if (open) Object.assign(form, { code: '', name: '', bedType: '', standardOccupancy: 2, maxOccupancy: 2, defaultRate: 100 })
})

function submit() {
  emit('submit', { ...form, code: form.code.toUpperCase() })
}
</script>

<template>
  <div v-if="open" class="modal-overlay" @click.self="emit('close')">
    <form class="app-modal" @submit.prevent="submit">
      <header class="app-modal-head"><div><span>基础资料</span><h2>新增房型</h2></div><button type="button" aria-label="关闭" @click="emit('close')"><X :size="18" /></button></header>
      <div class="app-modal-body form-grid">
        <label><span>房型编码</span><input v-model.trim="form.code" required maxlength="40" placeholder="例如 KING" /></label>
        <label><span>房型名称</span><input v-model.trim="form.name" required maxlength="80" placeholder="例如 高级大床房" /></label>
        <label class="wide"><span>床型</span><input v-model.trim="form.bedType" required maxlength="80" placeholder="例如 1.8 米大床" /></label>
        <label><span>标准入住</span><input v-model.number="form.standardOccupancy" type="number" min="1" required /></label>
        <label><span>最大入住</span><input v-model.number="form.maxOccupancy" type="number" :min="form.standardOccupancy" required /></label>
        <label class="wide"><span>默认房价</span><input v-model.number="form.defaultRate" type="number" min="0" step="0.01" required /></label>
      </div>
      <footer class="app-modal-foot"><button class="secondary-button" type="button" @click="emit('close')">取消</button><button class="primary-button" type="submit" :disabled="submitting"><Plus :size="15" />{{ submitting ? '正在保存…' : '创建房型' }}</button></footer>
    </form>
  </div>
</template>
