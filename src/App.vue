<template>
  <div class="app-container">

    <!-- 未ログイン -->
    <template v-if="!currentUser">
      <Login
        v-if="authPage === 'login'"
        @login-success="handleLoginSuccess"
      />

      <Register
        v-else
        @register-success="handleRegisterSuccess"
        @go-to-login="authPage = 'login'"
      />
    </template>

    <!-- ログイン済み -->
    <template v-else>

      <AppHeader
        :current-page="currentPage"
        :is-open="isSidebarOpen"
        @back="goBack"
        @toggle-menu="isSidebarOpen = !isSidebarOpen"
      />

      <!-- オフライン表示バー -->
      <div v-if="!isOnline" class="offline-bar">
        現在オフラインです。変更はローカルに保存され、接続時に同期されます。
      </div>

      <div
        v-if="isSidebarOpen"
        class="overlay"
        @click="isSidebarOpen = false"
      />

      <aside
        :class="[
          'sidebar',
          { open: isSidebarOpen },
        ]"
      >
        <div class="sidebar-header">
          <p class="user-name">
            {{ currentUser.name }} 様
          </p>

          <p class="user-email">
            {{ currentUser.email }}
          </p>
        </div>

        <nav class="sidebar-nav">
          <button type="button" @click="goBack">ホーム</button>
          <button type="button" @click="openAddPill">＋ 新しいお薬を追加</button>
          <button type="button" @click="goToHistory">処方履歴</button>
          <button type="button" @click="goToMailForm">お問い合わせ</button>
          <button type="button" @click="goToSettings">設定</button>
          <button type="button" class="logout-btn" @click="handleLogout">ログアウト</button>
        </nav>
      </aside>

      <main class="main-content">
        <!-- ホーム -->
        <div v-if="currentPage === 'home'" class="home-view">
          <div v-if="!pills || pills.length === 0" class="empty-state">
            <p>登録されているお薬はありません。</p>
            <button type="button" class="add-btn" @click="openAddPill">＋ お薬を追加する</button>
          </div>

          <div v-else class="pill-list">
            <PillCard
              v-for="pill in pills"
              :key="pill.id"
              :pill="pill"
              @select="goToDetail"
            />
          </div>
        </div>

        <!-- 詳細 -->
        <PillDetail
          v-else-if="currentPage === 'detail'"
          :pill="selectedPill"
          @back="goBack"
          @delete="openDeletePill"
          @update:today-record="handleRecordUpdated"
        />

        <!-- 履歴 -->
        <History
          v-else-if="currentPage === 'history'"
          :history-list="historyList || []"
          @reorder="handleReorderFromHistory"
        />

        <!-- 問い合わせ -->
        <MailForm
          v-else-if="currentPage === 'mail-form'"
          :user-email="currentUser.email"
        />

        <!-- 設定 -->
        <Settings
          v-else-if="currentPage === 'settings'"
          :user="currentUser"
          :schedule-times="scheduleTimes"
          :alert-options="alertOptions"
          @update-schedule-times="updateScheduleTimes"
          @update-alert-options="updateAlertOptions"
          @update-user="handleUserUpdated"
          @trigger-test-alert="triggerTestAlert"
        />
      </main>

      <AppFooter />

      <!-- 追加 -->
      <AddPill
        v-if="isAddPillOpen"
        @close="isAddPillOpen = false"
        @add="handleAdd"
      />

      <!-- 削除モーダル -->
      <DeletePill
        v-if="isDeletePillOpen"
        :pills="pills"
        @close="isDeletePillOpen = false"
        @delete-pill="handleDelete"
      />

      <!-- アラート -->
      <AlertPopup
        v-if="isAlertOpen"
        :timing="alertTiming"
        :pills="alertTargetPills"
        :options="alertOptions"
        @take-all="takeAll"
        @snooze="snoozeAlert"
        @close="isAlertOpen = false"
      />
    </template>

    <!-- トースト通知コンポーネント -->
    <ToastNotice
      :message="toastMessage"
      :is-visible="isToastVisible"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import PillCard from './components/PillCard.vue'
import PillDetail from './components/PillDetail.vue'
import AddPill from './components/AddPill.vue'
import DeletePill from './components/DeletePill.vue'
import History from './components/History.vue'
import MailForm from './components/MailForm.vue'
import Settings from './components/Settings.vue'
import AlertPopup from './components/AlertPopup.vue'
import ToastNotice from './components/ToastNotice.vue'

import type { AlertOptions, Pill, NewPillData, ScheduleTimes, User, HistoryRecord } from './types/medication'
import { useAuth, type AuthUser } from './composables/useAuth'
import { usePills } from './composables/usePills'
import { useSettings } from './composables/useSettings'
import { useCloudData } from './composables/useCloudData'
import { useNetworkStatus } from './composables/useNetworkStatus'
import { useToast } from './composables/useToast'
import { useNotifications } from './utils/notifications'
import { initializeFCM } from './firebase'

const { toastMessage, isToastVisible, showToast } = useToast()
const { currentUser, authPage, setUser, restoreUser, logout: authLogout, updateUser } = useAuth()
const { isOnline } = useNetworkStatus()

const currentPage = ref<'home' | 'detail' | 'history' | 'mail-form' | 'settings'>('home')
const selectedPill = ref<Pill | null>(null)
const isSidebarOpen = ref(false)
const isAddPillOpen = ref(false)
const isDeletePillOpen = ref(false)

const { 
  medicines: pills, 
  historyList, 
  addPill, 
  deletePill, 
  updateTodayRecord, 
  reorderPillsFromHistory 
} = usePills()

const { scheduleTimes, alertOptions } = useSettings()
const { saveDataToCloud, fetchCloudData } = useCloudData()

const { 
  isAlertOpen, 
  alertTiming, 
  alertTargetPills, 
  checkAlertSchedule, 
  start, 
  stop, 
  takeAll, 
  snoozeAlert, 
  triggerTestAlert, 
  dispose: disposeNotifications 
} = useNotifications(currentUser, pills, scheduleTimes, alertOptions, () => {})

const getActiveUserId = () => currentUser.value?.email || 'Guest'

function goBack() { currentPage.value = 'home'; selectedPill.value = null; isSidebarOpen.value = false }
function openAddPill() { isSidebarOpen.value = false; isAddPillOpen.value = true }
function openDeletePill() { isDeletePillOpen.value = true }
function goToHistory() { currentPage.value = 'history'; isSidebarOpen.value = false }
function goToMailForm() { currentPage.value = 'mail-form'; isSidebarOpen.value = false }
function goToSettings() { currentPage.value = 'settings'; isSidebarOpen.value = false }
function goToDetail(pill: Pill) { selectedPill.value = pill; currentPage.value = 'detail' }

function handleRecordUpdated(pill: Pill) { 
  updateTodayRecord(pill.id, pill.todayRecord)
  selectedPill.value = pills.value?.find(x => String(x.id) === String(pill.id)) || null 
}

function handleDelete(pillId: string | number) { 
  const deletedName = deletePill(pillId)
  
  if (selectedPill.value && String(selectedPill.value.id) === String(pillId)) {
    selectedPill.value = null
    currentPage.value = 'home'
  }
  
  saveDataToCloud(getActiveUserId())
  showToast(`「${deletedName}」を削除しました`)
}

function handleAdd(newPillData: NewPillData) { 
  const createdPill = addPill(newPillData)
  isAddPillOpen.value = false
  selectedPill.value = null
  currentPage.value = 'home'
  saveDataToCloud(getActiveUserId())
  showToast(`「${createdPill.name}」を追加しました`)
}

function handleReorderFromHistory(record: HistoryRecord) {
  reorderPillsFromHistory(record)
  selectedPill.value = null
  currentPage.value = 'home'
  isSidebarOpen.value = false
  saveDataToCloud(getActiveUserId())
  showToast('処方履歴からお薬を再登録しました')
}

function updateScheduleTimes(scheduleTimesUpdate: ScheduleTimes) { 
  Object.assign(scheduleTimes.value, scheduleTimesUpdate); 
  saveDataToCloud(getActiveUserId()) 
}

function updateAlertOptions(alertOptionsUpdate: AlertOptions) { 
  Object.assign(alertOptions.value, alertOptionsUpdate); 
  saveDataToCloud(getActiveUserId()) 
}

async function handleUserUpdated(user: User) { 
  try { 
    const updated = await updateUser(user); 
    if (updated) await fetchCloudData(user.email) 
  } catch (error) { 
    alert(error instanceof Error ? error.message : 'ユーザー情報の更新に失敗しました。') 
  } 
}

async function handleLoginSuccess(userAuth?: AuthUser) {
  if (userAuth) setUser(userAuth)
  const activeUser = currentUser.value
  if (!activeUser) return
  authPage.value = 'login'
  currentPage.value = 'home'
  selectedPill.value = null
  isSidebarOpen.value = false
  await fetchCloudData(activeUser.email)
  try { await initializeFCM(activeUser.email) } catch (error) { console.warn('FCM skip:', error) }
  checkAlertSchedule()
}

async function handleRegisterSuccess(userAuth?: AuthUser) {
  if (userAuth) setUser(userAuth)
  const activeUser = currentUser.value
  if (!activeUser) { authPage.value = 'login'; return }
  authPage.value = 'login'
  currentPage.value = 'home'
  await fetchCloudData(activeUser.email)
  try { await initializeFCM(activeUser.email) } catch (error) { console.warn('FCM skip:', error) }
  checkAlertSchedule()
}

function handleLogout() {
  stop()
  authLogout()
  authPage.value = 'login'
  if (pills) pills.value = []
  if (historyList) historyList.value = []
  selectedPill.value = null
  currentPage.value = 'home'
  isSidebarOpen.value = false
  isAddPillOpen.value = false
  isDeletePillOpen.value = false
  isAlertOpen.value = false
  document.body.style.overflow = ''
}

onMounted(async () => {
  const u = restoreUser()
  if (u) {
    await fetchCloudData(u.email)
  } else {
    authPage.value = 'login'
  }
  start()
})

onUnmounted(() => { disposeNotifications(); document.body.style.overflow = '' })

watch(
  [pills, historyList, scheduleTimes, alertOptions], 
  () => { saveDataToCloud(getActiveUserId()) }, 
  { deep: true }
)

watch(
  [isSidebarOpen, isAddPillOpen, isDeletePillOpen, isAlertOpen], 
  ([s, a, d, al]) => { document.body.style.overflow = (s || a || d || al) ? 'hidden' : '' }
)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f7faf8;
  display: flex;
  flex-direction: column;
}

.offline-bar {
  background-color: #f59e0b;
  color: #fff;
  text-align: center;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: bold;
}

.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 90;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background-color: #ffffff;
  z-index: 100;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  padding: 24px 16px;
  background-color: #eaf3ec;
}

.user-name {
  font-weight: bold;
  color: #2e5a44;
  margin: 0;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
  margin: 4px 0 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 6px;
}

.sidebar-nav button {
  background: none;
  border: none;
  text-align: left;
  padding: 12px 16px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #3b5e4c;
  cursor: pointer;
  border-radius: 12px;
}

.sidebar-nav .logout-btn {
  margin-top: 20px;
  color: #d9534f;
}

.main-content {
  flex: 1;
  padding: 20px 16px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.pill-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.add-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
</style>