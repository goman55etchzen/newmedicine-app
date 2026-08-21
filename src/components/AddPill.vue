<!-- src/components/AddPill.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { NewPillData } from '../types/medication'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add', data: NewPillData): void
}>()

const name = ref('')
const totalQuantity = ref<number>(30)
const dosagePerTake = ref<number>(1)
const prescriptionDate = ref(new Date().toISOString().substring(0, 10))

function handleSubmit() {
  if (!name.value.trim()) return
  emit('add', {
    name: name.value,
    totalQuantity: Number(totalQuantity.value),
    dosagePerTake: Number(dosagePerTake.value),
    prescriptionDate: prescriptionDate.value
  })
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <h3>新しいお薬を追加</h3>
      <form @submit.prevent="handleSubmit">
        <label>お薬の名前: <input v-model="name" required /></label>
        <label>処方された総量: <input v-model.number="totalQuantity" type="number" min="1" required /></label>
        <label>1回の服用量: <input v-model.number="dosagePerTake" type="number" min="1" required /></label>
        <label>処方日: <input v-model="prescriptionDate" type="date" required /></label>
        <div class="actions">
          <button type="button" @click="emit('close')">キャンセル</button>
          <button type="submit">登録する</button>
        </div>
      </form>
    </div>
  </div>
</template>