<!-- src/components/Login.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { AuthUser } from '../composables/useAuth'

const emit = defineEmits<{
  (e: 'login-success', user?: AuthUser): void
}>()

const email = ref('')
const password = ref('')

function handleLogin() {
  if (!email.value) return
  // ログイン処理サンプルのダミーユーザー発行
  const mockUser: AuthUser = {
    id: 'user-1',
    name: email.value.split('@')[0] || 'ユーザー',
    email: email.value
  }
  emit('login-success', mockUser)
}
</script>

<template>
  <div class="auth-card">
    <h2>ログイン</h2>
    <form @submit.prevent="handleLogin">
      <label>メールアドレス: <input v-model="email" type="email" required /></label>
      <label>パスワード: <input v-model="password" type="password" required /></label>
      <button type="submit">ログイン</button>
    </form>
  </div>
</template>