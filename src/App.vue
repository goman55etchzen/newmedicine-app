<template>
<div class="app-container">
  <header class="app-header">
    <button
      type="button"
      id="menu-button"
      @click="isOpen = !isOpen"
      :class="{ open: isOpen }"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <transition name="fade">
      <div v-show="isOpen" class="nav-overlay" @click="isOpen = false"></div>
    </transition>
    <transition name="slide">
      <nav v-show="isOpen" @click.stop>
        <ul>
          <li><a href="#" @click.prevent="goBack">ホーム</a></li>
          <li><a href="#" @click.prevent="openAddModal">お薬の追加</a></li>
          <li>
            <a href="#" @click.prevent="goToHistory">おくすりの履歴</a>
          </li>
          <li><a href="#" @click.prevent>お問い合わせ</a></li>
        </ul>
      </nav>
    </transition>
  </header>

  <main v-if="currentPage === 'home'" class="page">
    <h1>お薬管理アプリ</h1>
    <div class="card-list">
      <PillCard
        v-for="pill in pills"
        :key="pill.id"
        :pill="pill"
        @click="goToDetail(pill)"
      />
    </div>
    <div class="action-row">
      <button class="open-del-btn" @click="openDelModal">
        おくすり記録の削除
      </button>
    </div>
  </main>

  <main v-else-if="currentPage === 'detail' && selectedPill" class="page">
    <PillDetail
      v-model:todayRecord="selectedPill.todayRecord"
      :pill="selectedPill"
      @back="goBack"
    />
  </main>

  <main v-else-if="currentPage === 'history'" class="page">
    <History :historyList="historyList" @back="goBack" />
  </main>

  <AddModal v-model:isOpen="isAddModalOpen" @add-pill="addPill" />

  <DelModal
    v-model:isOpen="isDelModalOpen"
    :pills="pills"
    @delete-pill="deletePill"
  />
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PillCard from './PillCard.vue';
import PillDetail from './PillDetail.vue';
import AddModal from './AddModal.vue';
import DelModal from './DelModal.vue';
import History from './History.vue';

// 1. お薬データの型（インターフェース）を定義
interface Pill {
id: number;
name: string;
prescribedDate: string;
totalDays: number;
dosage: string;
timing: {
  朝: boolean;
  昼: boolean;
  夜: boolean;
  就寝前: boolean;
};
todayRecord: {
  朝: boolean;
  昼: boolean;
  夜: boolean;
  就寝前: boolean;
};
}

interface HistoryRecord {
date: string;
pills: { name: string; dosage: string; totalDays: number }[];
}

// ⭕ 修正：型定義の 'History' を小文字の 'history' に統一
const currentPage = ref<'home' | 'detail' | 'history'>('home');

const selectedPill = ref<Pill | null>(null);
const isOpen = ref(false);
const isAddModalOpen = ref(false);
const isDelModalOpen = ref(false); // ⭕ 修正：Mの小文字ブレを修正

// ⭕ 修正：構文エラーを綺麗にし、小文字の historyList に統一
const historyList = ref<HistoryRecord[]>([
{
  date: '2026-06-01',
  pills: [{ name: '葛根湯', dosage: '1袋', totalDays: 5 }]
}
]);

// 3. pills 配列にも Pill[] 型を適用
const pills = ref<Pill[]>([
{
  id: 1,
  name: 'アタラックス',
  prescribedDate: '2026-05-20',
  totalDays: 30,
  dosage: '300mg (3錠)',
  timing: { 朝: true, 昼: true, 夜: false, 就寝前: true },
  todayRecord: { 朝: false, 昼: false, 夜: false, 就寝前: false },
},
{
  id: 2,
  name: 'ロキソニン',
  prescribedDate: '2026-05-25',
  totalDays: 15,
  dosage: '60mg (1錠)',
  timing: { 朝: false, 昼: true, 夜: true, 就寝前: false },
  todayRecord: { 朝: false, 昼: false, 夜: false, 就寝前: false },
},
{
  id: 3,
  name: 'ロラゼパム',
  prescribedDate: '2026-05-27',
  totalDays: 90,
  dosage: '100mg (1錠)',
  timing: { 朝: true, 昼: true, 夜: true, 就寝前: true },
  todayRecord: { 朝: false, 昼: false, 夜: false, 就寝前: false },
},
]);

const goToDetail = (pill: Pill) => {
selectedPill.value = pill;
currentPage.value = 'detail';
isOpen.value = false;
};

const goBack = () => {
currentPage.value = 'home';
selectedPill.value = null;
isOpen.value = false;
};

const openAddModal = () => {
isAddModalOpen.value = true;
isOpen.value = false;
};

// ⭕ 修正：小文字の 'history' に統一
const goToHistory = () => {
currentPage.value = 'history';
isOpen.value = false;
};

const openDelModal = () => {
isDelModalOpen.value = true;
};

const addPill = (newPillData: Omit<Pill, 'id' | 'todayRecord'>) => {
const id = pills.value.length
  ? Math.max(...pills.value.map((p) => p.id)) + 1 : 1;

pills.value.push({
  id,
  name: newPillData.name,
  prescribedDate: newPillData.prescribedDate,
  totalDays: newPillData.totalDays,
  dosage: newPillData.dosage,
  timing: { ...newPillData.timing },
  todayRecord: { 朝: false, 昼: false, 夜: false, 就寝前: false },
});

// ⭕ 修正：historyList の変数名を揃える
const sameDateRecord = historyList.value.find(h => h.date === newPillData.prescribedDate);

if (sameDateRecord) {
  sameDateRecord.pills.push({
    name: newPillData.name,
    dosage: newPillData.dosage,
    totalDays: newPillData.totalDays
  });
} else {
  historyList.value.unshift({
    date: newPillData.prescribedDate,
    pills: [{ name: newPillData.name, dosage: newPillData.dosage, totalDays: newPillData.totalDays }]
  });

  if (historyList.value.length > 3) {
    historyList.value.pop();
  }
}
currentPage.value = 'home';
};

// ⭕ 修正：addPill関数の外側に独立して配置
const deletePill = (id: number) => {
pills.value = pills.value.filter(p => p.id !== id);
};
</script>

<style scoped>
/* スタイルは以前の完成版をそのまま維持しているので変更不要です */
.app-container {
max-width: 900px;
width: 90%;
margin: 0 auto;
font-family: sans-serif;
color: black;
background-color: #f8f9fa;
min-height: 100vh;
position: relative;
overflow-x: hidden;
}
.app-header {
background-color: #41b883;
color: white;
text-align: center;
padding: 10px;
position: relative;
width: 100%;
height: 50px;
}
.page {
padding: 15px;
}
#menu-button {
position: absolute;
top: 50%;
right: 30px;
transform: translateY(-50%);
width: 30px;
height: 24px;
border: none;
cursor: pointer;
padding: 0;
z-index: 150;
background: transparent !important;
}
#menu-button span {
position: absolute;
left: 0;
display: block;
width: 100%;
height: 3px;
background-color: white;
border-radius: 2px;
transition: all 0.3s ease;
}
#menu-button span:nth-child(1) { top: 0; }
#menu-button span:nth-child(2) { top: 10px; }
#menu-button span:nth-child(3) { top: 20px; }
#menu-button.open span:nth-child(1) { transform: translateY(10px) rotate(45deg); }
#menu-button.open span:nth-child(2) { opacity: 0; }
#menu-button.open span:nth-child(3) { transform: translateY(-10px) rotate(-45deg); }

.nav-overlay {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100vh;
background: rgba(0, 0, 0, 0.5);
z-index: 100;
}
nav {
position: fixed;
top: 0;
right: 0;
width: 250px;
height: 100vh;
background: #1a202c;
display: flex;
justify-content: center;
align-items: center;
box-shadow: -4px 0 1px rgba(0, 0, 0, 0.3);
z-index: 130;
}
nav ul {
list-style: none;
padding: 0;
margin: 0;
text-align: left;
}
nav ul li { margin: 30px 0; }
nav ul li a {
color: white;
text-decoration: none;
font-size: 1.3rem;
font-weight: bold;
transition: color 0.2s;
}
nav ul li a:hover { color: #41b883; }

.action-row {
margin-top: 20px;
text-align: center;
}
.open-del-btn {
background-color: #e53e3e;
color: white;
border: none;
padding: 10px 20px;
border-radius: 6px;
font-weight: bold;
cursor: pointer;
font-size: 1rem;
}
.open-del-btn:hover { background-color: #c53030; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>