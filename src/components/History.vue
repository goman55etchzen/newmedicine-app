<!-- src/components/History.vue -->
<script setup lang="ts">
import type { HistoryRecord } from '../types/medication'

defineProps<{
  historyList: HistoryRecord[]
}>()

const emit = defineEmits<{
  (e: 'reorder', record: HistoryRecord): void
}>()
</script>

<template>
  <div class="history-view">
    <h3>処方履歴 (最新5件)</h3>
    <div v-if="!historyList || historyList.length === 0">履歴はありません。</div>
    <ul v-else>
      <li v-for="item in historyList.slice(0, 5)" :key="item.id">
        <span>{{ item.prescriptionDate }} - {{ item.name }} ({{ item.totalQuantity }}日分)</span>
        <button type="button" @click="emit('reorder', item)">再登録する</button>
      </li>
    </ul>
  </div>
</template>