<template>
<div class="history-container">
  <button class="back-button" @click="$emit('back')">ホームへ戻る</button>
  <h2>おくすりの履歴（直近3回分）</h2>

  <div v-if="historyList.length === 0" class="no-data">
    履歴はまだありません。
  </div>

  <div v-else class="history-list">
    <div v-for="(record, index) in historyList" :key="index" class="history-item">
      <div class="history-date">📅 処方日: {{ record.date }}</div>
      <ul class="history-pills">
        <li v-for="(p, pIdx) in record.pills" :key="pIdx">
          <strong>{{ p.name }}</strong> — {{ p.dosage }} ({{ p.totalDays }}日分)
        </li>
      </ul>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
defineProps<{
historyList: {
  date: string;
  pills: { name: string; dosage: string; totalDays: number }[];
}[]
}>();

defineEmits(['back']);
</script>

<style scoped>
.history-container {
background: white;
padding: 20px;
border-radius: 8px;
border: 1px solid #ddd;
}
.back-button {
background: #41b883;
border: none;
color: white;
cursor: pointer;
font-size: 0.9rem;
padding: 6px 14px;
margin-bottom: 15px;
border-radius: 20px;
font-weight: bold;
}
h2 {
color: #333;
border-bottom: 2px solid #41b883;
padding-bottom: 8px;
}
.no-data {
text-align: center;
color: #718096;
padding: 20px 0;
}
.history-item {
background: #f7fafc;
border: 1px solid #e2e8f0;
border-radius: 6px;
padding: 15px;
margin-bottom: 15px;
}
.history-date {
font-weight: bold;
color: #2b6cb0;
margin-bottom: 10px;
}
.history-pills {
padding-left: 20px;
margin: 0;
}
.history-pills li {
margin-bottom: 6px;
}
</style>