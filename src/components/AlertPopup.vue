<template>
  <div v-if="visible" class="alert-backdrop">
    <div class="alert-modal">
      <div class="alert-icon">⏰</div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button @click="close" class="confirm-btn">確認（服用完了）</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  title: string;
  message: string;
}>();

const emit = defineEmits<{(e: 'close'): void}>();

const close = () => {
  emit('close');
};
</script>

<style scoped>
.alert-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.alert-modal { background: white; padding: 24px; border-radius: 16px; text-align: center; width: 85%; max-width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.alert-icon { font-size: 3rem; margin-bottom: 8px; }
.confirm-btn { margin-top: 16px; width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; }
</style>