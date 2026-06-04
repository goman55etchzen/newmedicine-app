<template>
<div class="detail-container">
  <button class="back-button" @click="$emit('back')">ホームへ戻る</button>

  <h2>{{ pill.name }}</h2>

  <div class="detail-info">
    <p><strong>1日の分量:</strong> {{ pill.dosage }}</p>
    <p><strong>処方日数:</strong> {{ pill.totalDays }}日分</p>
  </div>

  <h3>服用タイミングと本日の記録</h3>
  <ul class="timing-list">
    <li v-for="time in timings" :key="time" :class="{ 'checked-item': todayRecord[time] }">
      <div class="timing-info">
        <span v-if="pill.timing[time]" class="must-take-badge">💊</span>
        <span v-else class="no-take-badge">なし</span>
        <span class="timing-name">{{ time }}</span>
      </div>
      <label class="action-button" :class="{ 'is-done': todayRecord[time] }">
        <input type="checkbox" v-model="todayRecord[time]" />
        <span>{{ todayRecord[time] ? '✓ 服用済み' : '飲む' }}</span>
      </label>
    </li>
  </ul>
</div>
</template>

<script setup lang="ts">
const props = defineProps({
pill: {
  type: Object,
  required: true
}
});

// 親コンポーネントの selectedPill.todayRecord と同期するための v-model 定義
const todayRecord = defineModel('todayRecord', { type: Object, required: true });

defineEmits(['back']);

// ループで回せるように配列化
const timings = ['朝', '昼', '夜', '就寝前'];
</script>

<style scoped>
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

.detail-container {
background: white;
padding: 20px;
border-radius: 8px;
border: 1px solid #ddd;
}

.detail-info p {
border: solid 2px #4ec4d3;
border-radius: 5px;
padding: 8px;
margin: 8px 0;
}

.timing-list {
list-style: none;
padding: 0;
}

.timing-list li {
display: flex;
justify-content: space-between;
align-items: center;
padding: 12px;
margin-bottom: 10px;
border: 1px solid #e2e8f0;
border-radius: 8px;
background-color: #fff;
}

.timing-info {
display: flex;
align-items: center;
gap: 12px;
}

.must-take-badge {
background-color: #e53e3e;
color: white;
font-size: 0.75rem;
font-weight: bold;
padding: 2px 8px;
border-radius: 4px;
}

.no-take-badge {
background-color: #edf2f7;
color: #a0aec0;
font-size: 0.75rem;
padding: 2px 8px;
border-radius: 4px;
}

.timing-name {
font-weight: bold;
font-size: 1.05rem;
}

.action-button {
display: flex;
align-items: center;
gap: 6px;
background-color: #ebf8ff;
border: 2px solid #4299e1;
color: #2b6cb0;
padding: 6px 16px;
border-radius: 20px;
cursor: pointer;
font-weight: bold;
user-select: none;
}

.action-button input[type='checkbox'] {
display: none;
}

.action-button.is-done {
background-color: #48bb78;
border-color: #48bb78;
color: white;
}

.timing-list li.checked-item {
background-color: #f0fff4;
border-color: #c6f6d5;
}

h3 {
color: green;
}
</style>