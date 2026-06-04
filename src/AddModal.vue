<template>
<transition name="fade">
  <div v-show="isOpen" class="modal-overlay" @click="closeAddModal">
    <div class="modal-content" @click.stop>
      <h2>新しくお薬を追加</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>お薬の名前</label>
          <input type="text" v-model="newPill.name" required placeholder="例：パブロン" />
        </div>
        <div class="form-group">
          <label>処方日</label>
          <input type="date" v-model="newPill.prescribedDate" required />
        </div>
        <div class="form-group">
          <label>処方日数 (日分)</label>
          <input type="number" v-model.number="newPill.totalDays" min="1" required />
        </div>
        <div class="form-group">
          <label>1日の分量</label>
          <input type="text" v-model="newPill.dosage" required placeholder="例：3錠 (毎食後)" />
        </div>
        <div class="form-group">
          <label>服用タイミング</label>
          <div class="checkbox-group">
            <label><input type="checkbox" v-model="newPill.timing.朝" /> 朝</label>
            <label><input type="checkbox" v-model="newPill.timing.昼" /> 昼</label>
            <label><input type="checkbox" v-model="newPill.timing.夜" /> 夜</label>
            <label><input type="checkbox" v-model="newPill.timing.就寝前" /> 就寝前</label>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeAddModal">キャンセル</button>
          <button type="submit" class="submit-btn">追加する</button>
        </div>
      </form>
    </div>
  </div>
</transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// モーダルの表示・非表示を親と同期
const isOpen = defineModel('isOpen', { type: Boolean, default: false });
const emit = defineEmits(['add-pill']);

// フォームの初期状態を生成する関数
const getInitialPillState = () => ({
name: '',
prescribedDate: new Date().toISOString().split('T')[0],
totalDays: 7,
dosage: '',
timing: { 朝: false, 昼: false, 夜: false, 就寝前: false }
});

const newPill = ref(getInitialPillState());

const closeAddModal = () => {
isOpen.value = false;
newPill.value = getInitialPillState(); // フォームをリセット
};

const handleSubmit = () => {
emit('add-pill', newPill.value);
closeAddModal();
};
</script>

<style scoped>
.modal-overlay {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100vh;
background: rgba(0, 0, 0, 0.6);
display: flex;
justify-content: center;
align-items: center;
z-index: 200;
}

.modal-content {
background: white;
padding: 24px;
border-radius: 12px;
width: 90%;
max-width: 500px;
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h2 {
margin-top: 0;
margin-bottom: 20px;
color: #333;
font-size: 1.4rem;
border-bottom: 2px solid #41b883;
padding-bottom: 8px;
}

.form-group {
margin-bottom: 16px;
}

.form-group label {
display: block;
font-weight: bold;
margin-bottom: 6px;
font-size: 0.9rem;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="number"] {
width: 100%;
padding: 10px;
border: 1px solid #ccc;
border-radius: 6px;
font-size: 1rem;
box-sizing: border-box;
}

.checkbox-group {
display: flex;
gap: 12px;
flex-wrap: wrap;
background: #f1f5f9;
padding: 10px;
border-radius: 6px;
}

.checkbox-group label {
display: flex;
align-items: center;
gap: 4px;
cursor: pointer;
margin-bottom: 0;
}

.modal-actions {
display: flex;
justify-content: flex-end;
gap: 12px;
margin-top: 24px;
}

.cancel-btn {
background: #e2e8f0;
border: none;
padding: 10px 20px;
border-radius: 6px;
cursor: pointer;
font-weight: bold;
}

.submit-btn {
background: #41b883;
color: white;
border: none;
padding: 10px 20px;
border-radius: 6px;
cursor: pointer;
font-weight: bold;
}

.submit-btn:hover {
background: #35495e;
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>