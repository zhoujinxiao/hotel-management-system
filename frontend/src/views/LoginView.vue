<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KeyRound, LockKeyhole, ShieldCheck } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ username: '', password: '' })
const errorMessage = ref('')

async function submit() {
  errorMessage.value = ''
  try {
    await auth.login(form)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试'
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-story">
      <div class="login-brand"><span>云</span><strong>云栖酒店</strong></div>
      <div class="login-copy">
        <p>湖滨店 · 内部运营系统</p>
        <h1>把房态、预订和账务放在同一张台面上。</h1>
        <div class="login-feature"><ShieldCheck :size="19" /><span>独立员工账号</span></div>
        <div class="login-feature"><KeyRound :size="19" /><span>敏感操作经理认证</span></div>
      </div>
      <small>仅限授权员工使用</small>
    </section>

    <section class="login-panel">
      <form class="login-form" @submit.prevent="submit">
        <div class="login-form-head">
          <span class="login-lock"><LockKeyhole :size="20" /></span>
          <div><h2>登录运营台</h2><p>使用分配给你的员工账号</p></div>
        </div>
        <label>
          <span>用户名</span>
          <input v-model.trim="form.username" autocomplete="username" required autofocus />
        </label>
        <label>
          <span>密码</span>
          <input v-model="form.password" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
        <button type="submit" :disabled="auth.loading">{{ auth.loading ? '正在验证…' : '登录' }}</button>
        <small>账号由管理员创建，不提供公开注册。</small>
      </form>
    </section>
  </main>
</template>
