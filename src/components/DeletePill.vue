<!-- src/components/DeletePill.vue -->
<script setup lang="ts">
import type { Pill } from '../types/medication'

defineProps<{
  pills: Pill[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete-pill', pillId: string | number): void
}>()
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <h3>お薬の削除</h3>
      <ul>
        <li v-for="pill in pills" :key="pill.id">
          <span>{{ pill.name }}</span>
          <button type="button" @click="emit('delete-pill', pill.id)">削除</button>
        </li>
      </ul>
      <button type="button" @click="emit('close')">閉じる</button>
    </div>
  </div>
</template>