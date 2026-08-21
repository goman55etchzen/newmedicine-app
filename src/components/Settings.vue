<template>
  <div class="settings-container">
    <h2>⚙️ 設定</h2>

    <!-- 服用通知時間設定 -->
    <section class="section">
      <h3>⏰ 服用時間の標準設定</h3>
      <div v-for="(time, key) in scheduleTimes" :key="key" class="setting-item">
        <label>{{ key }}</label>
        <input type="time" v-model="scheduleTimes[key]" @change="handleSave" />
      </div>
    </section>

    <!-- 通知スタイル設定 -->
    <section class="section">
      <h3>🔔 通知オプション</h3>
      <div class="setting-item checkbox">
        <label>
          <input type="checkbox" v-model="alertOptions.popupEnabled" @change="handleSave" />
          画面ポップアップ表示
        </label>
      </div>
      <div class="setting-item checkbox">
        <label>
          <input type="checkbox" v-model="alertOptions.soundEnabled" @change="handleSave" />
          通知音の再生
        </label>
      </div>
      <div class="setting-item checkbox">
        <label>
          <input type="checkbox" v-model="alertOptions.vibrateEnabled" @change="handleSave" />
          バイブレーション
        </label>
      </div>
    </section>

    <div v-if="saving" class="status-msg">保存中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSettings } from '../composables/useSettings';
import { useAuth } from '../composables/useAuth';
import { syncDataToGAS } from '../firebase';
import { useToast } from '../composables/useToast';

const { scheduleTimes, alertOptions } = useSettings();
const { user } = useAuth();
const { showToast } = useToast();
const saving = ref(false);

const handleSave = async () => {
  if (!user.value) return;
  saving.value = true;
  try {
    const success = await syncDataToGAS(user.value.email, {
      scheduleTimes: scheduleTimes.value,
      alertOptions: alertOptions.value,
    });
    if (success) {
      showToast('設定を保存しました', 'success');
    } else {
      showToast('設定の保存に失敗しました', 'error');
    }
  } catch {
    showToast('エラーが発生しました', 'error');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.settings-container { padding: 20px; max-width: 500px; margin: 0 auto; }
.section { margin-bottom: 24px; background: #ffffff; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.setting-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.setting-item.checkbox { justify-content: flex-start; }
input[type="time"] { padding: 6px 10px; border-radius: 6px; border: 1px solid #ccc; }
.status-msg { text-align: center; color: #10b981; font-size: 0.9rem; }
</style>