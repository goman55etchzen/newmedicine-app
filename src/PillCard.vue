<template>
<div class="pill-card">
  <div class="card-row">
    <span class="date-badge">{{ pill.prescribedDate }}</span>
    <strong class="pill-name">{{ pill.name }}</strong>
  </div>
  <div class="card-status">
    <span>{{ pill.totalDays }}日分</span>
    <span class="highlight">現在 {{ elapsedDays }} 日目</span>
    <span class="warning">残り {{ remainingDays }} 日分</span>
  </div>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
pill: {
  type: Object,
  required: true
}
});

// 経過日数の計算
const elapsedDays = computed(() => {
const today = new Date();
today.setHours(0, 0, 0, 0);
const start = new Date(props.pill.prescribedDate + 'T00:00:00');
const diffTime = today - start;
const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
return diffDays < 1 ? 0 : diffDays;
});

// 残り日数の計算
const remainingDays = computed(() => {
if (elapsedDays.value === 0) return props.pill.totalDays;
if (elapsedDays.value > props.pill.totalDays) {
  return 0;
}
return props.pill.totalDays - elapsedDays.value + 1;
});
</script>

<style scoped>
.pill-card {
background: white;
border: 1px solid #ddd;
border-radius: 8px;
padding: 15px;
margin-bottom: 12px;
cursor: pointer;
}

.card-row {
display: flex;
align-items: center;
gap: 10px;
margin-bottom: 10px;
}

.date-badge {
background-color: #e2e8f0;
padding: 2px 6px;
border-radius: 4px;
font-size: 0.85rem;
}

.pill-name {
font-size: 1.1rem;
}

.card-status {
display: flex;
justify-content: space-between;
font-size: 0.9rem;
}

.highlight {
color: #2b6cb0;
font-weight: bold;
}

.warning {
color: #c53030;
font-weight: bold;
}
</style>