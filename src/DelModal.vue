<template>
<transition name="fade">
  <div v-show="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>おくすり記録の削除</h2>
      
      <div v-if="pills.length === 0" class="no-data">
        削除できるお薬がありません。
      </div>

      <ul v-else class="del-list">
        <li v-for="pill in pills" :key="pill.id">
          <span class="pill-info">{{ pill.name }} ({{ pill.prescribedDate }}処方)</span>
          <button class="del-btn" @click="confirmDelete(pill.id, pill.name)">削除</button>
        </li>
      </ul>

      <div class="modal-actions">
        <button type="button" class="cancel-btn" @click="closeModal">閉じる</button>
      </div>
    </div>
  </div>
</transition>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('isOpen', { default: false });

defineProps<{
pills: { id: number; name: string; prescribedDate: string }[]
}>();

const emit = defineEmits(['delete-pill']);

const closeModal = () => {
isOpen.value = false;
};

const confirmDelete = (id: number, name: string) => {
if (confirm(`「${name}」の記録を削除してもよろしいですか？`)) {
  emit('delete-pill', id);
}
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
h2 {
margin-top: 0;
color: #e53e3e;
border-bottom: 2px solid #e53e3e;
padding-bottom: 8px;
}
.no-data {
text-align: center;
padding: 20px 0;
color: #718096;
}
.del-list {
list-style: none;
padding: 0;
max-height: 250px;
overflow-y: auto;
}
.del-list li {
display: flex;
justify-content: space-between;
align-items: center;
padding: 10px;
border-bottom: 1px solid #edf2f7;
}
.pill-info {
font-weight: bold;
}
.del-btn {
background: #e53e3e;
color: white;
border: none;
padding: 4px 10px;
border-radius: 4px;
cursor: pointer;
}
.del-btn:hover {
background: #c53030;
}
.modal-actions {
display: flex;
justify-content: flex-end;
margin-top: 20px;
}
.cancel-btn {
background: #e2e8f0;
border: none;
padding: 8px 16px;
border-radius: 6px;
cursor: pointer;
font-weight: bold;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>