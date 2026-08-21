<template>
  <header class="app-header">
    <div class="header-content">
      <h1 @click="emit('navigate', 'home')" class="logo">💊 お薬管理</h1>
      
      <nav class="nav-menu">
        <button @click="emit('navigate', 'home')">ホーム</button>
        <button @click="emit('navigate', 'settings')">設定</button>
        <button @click="emit('navigate', 'contact')">問合せ</button>
        <button v-if="user" @click="handleLogout" class="logout-btn">ログアウト</button>
        <button v-else @click="emit('navigate', 'login')" class="login-btn">ログイン</button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuth } from '../composables/useAuth';

const emit = defineEmits<{(e: 'navigate', page: string): void}>();
const { user, setUser } = useAuth();

const handleLogout = () => {
  setUser(null);
  emit('navigate', 'login');
};
</script>

<style scoped>
.app-header { background: #065f46; color: white; padding: 12px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.header-content { max-width: 800px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 1.2rem; margin: 0; cursor: pointer; }
.nav-menu { display: flex; gap: 8px; }
.nav-menu button { background: transparent; border: none; color: white; padding: 6px 10px; font-size: 0.9rem; cursor: pointer; border-radius: 4px; }
.nav-menu button:hover { background: rgba(255,255,255,0.15); }
.logout-btn { border: 1px solid rgba(255,255,255,0.4) !important; }
.login-btn { background: #10b981 !important; font-weight: bold; }
</style>