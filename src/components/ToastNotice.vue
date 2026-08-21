<template>
  <Transition name="toast">
    <div v-if="toastState.show" :class="['toast-notice', toastState.type]">
      {{ toastState.message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toastState } = useToast();
</script>

<style scoped>
.toast-notice {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 25px;
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  z-index: 2000;
}
.toast-notice.success { background: #10b981; }
.toast-notice.error { background: #ef4444; }
.toast-notice.info { background: #3b82f6; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 20px); }
</style>