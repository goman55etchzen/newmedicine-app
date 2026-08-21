<!-- src/components/PillDetail.vue -->
<script setup lang="ts">
import type { Pill } from '../types/medication'

const props = defineProps<{
  pill: Pill | null
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'delete'): void
  (e: 'update:todayRecord', pill: Pill): void
}>()

function toggleTaken() {
  if (!props.pill) return
  const updatedPill = { ...props.pill, todayRecord: !props.pill.todayRecord }
  emit('update:todayRecord', updatedPill)
}
</script>

<template>
  <div v-if="pill" class="pill-detail">
    <button type="button" @click="emit('back')">← 戻る</button>
    <h2>{{ pill.name }}</h2>
    <p>残り容量: {{ pill.remainingQuantity }} / {{ pill.totalQuantity }}</p>
    <p>処方日: {{ pill.prescriptionDate }}</p>
    
    <button type="button" @click="toggleTaken">
      本日の服用ステータス: {{ pill.todayRecord ? '服用済み' : '未服用' }}
    </button>
    
    <button type="button" class="delete-btn" @click="emit('delete')">削除する</button>
  </div>
</template>