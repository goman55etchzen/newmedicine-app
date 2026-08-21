<!-- src/components/PillCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Pill } from '../types/medication'

const props = defineProps<{
  pill: Pill
}>()

const emit = defineEmits<{
  (e: 'select', pill: Pill): void
}>()

const daysSincePrescription = computed(() => {
  const start = new Date(props.pill.prescriptionDate).getTime()
  const today = new Date().getTime()
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 ? diffDays : 0
})
</script>

<template>
  <div class="pill-card" @click="emit('select', pill)">
    <h4>{{ pill.name }}</h4>
    <p>処方から: {{ daysSincePrescription }} 日経過</p>
    <p>残り: {{ pill.remainingQuantity }}包/錠</p>
  </div>
</template>