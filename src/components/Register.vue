<!-- src/components/Register.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { AuthUser } from '../composables/useAuth'

const emit = defineEmits<{
  (e: 'register-success', user?: AuthUser): void
  (e: 'go-to-login'): void
}>()

const name = ref('')
const email = ref('')
const password = ref('')

function handleRegister() {
  if (!email.value || !name.value) return
  const mockUser: AuthUser = {
    id: 'user-' + Date.now(),
    name: name.value,
    email: email.value
  }
  emit('register-success', mockUser)
}
</script>

<template>
  <div class="auth-card">
    <h2>新規ユーザー登録</h2>
    <form @submit.prevent="handleRegister">
      <label>お名前: <input v-model="name" type="text" required /></label>
      <label>メールアドレス: <input v-model="email" type="email" required /></label>
      <label>パスワード: <input v-model="password" type="password" required /></label>
      <button type="submit">登録</button>
    </form>
    <button type="button" class="link-btn" @click="emit('go-to-login')">
      すでにアカウントをお持ちの方（ログインへ）
    </button>
  </div>
</template>