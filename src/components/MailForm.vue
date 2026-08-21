<template>
  <div class="mail-form-container">
    <h2>✉️ お問い合わせ</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="category">お問い合わせ種別</label>
        <select id="category" v-model="form.category" required>
          <option value="usage">使い方について</option>
          <option value="bug">不具合の報告</option>
          <option value="feature">機能のご要望</option>
          <option value="other">その他</option>
        </select>
      </div>

      <div class="form-group">
        <label for="email">返信先メールアドレス</label>
        <input id="email" type="email" v-model="form.email" required placeholder="example@email.com" />
      </div>

      <div class="form-group">
        <label for="message">内容</label>
        <textarea id="message" v-model="form.message" rows="5" required placeholder="お問い合わせ内容を入力してください"></textarea>
      </div>

      <button type="submit" :disabled="sending" class="submit-btn">
        {{ sending ? '送信中...' : '送信する' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';

const { user } = useAuth();
const { showToast } = useToast();

const form = ref({
  category: 'usage',
  email: '',
  message: '',
});
const sending = ref(false);

onMounted(() => {
  if (user.value?.email) {
    form.value.email = user.value.email;
  }
});

const handleSubmit = async () => {
  sending.value = true;
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    });
    if (res.ok) {
      showToast('お問い合わせを送信しました', 'success');
      form.value.message = '';
    } else {
      showToast('送信に失敗しました', 'error');
    }
  } catch {
    showToast('通信エラーが発生しました', 'error');
  } finally {
    sending.value = false;
  }
};
</script>

<style scoped>
.mail-form-container { padding: 20px; max-width: 500px; margin: 0 auto; }
.form-group { margin-bottom: 16px; }
label { display: block; font-weight: bold; margin-bottom: 6px; }
input, select, textarea { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; box-sizing: border-box; }
.submit-btn { width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
.submit-btn:disabled { background: #9ca3af; }
</style>