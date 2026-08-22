// src/composables/usePills.ts

import { ref } from 'vue'
import type {
  Pill,
  NewPillData,
  HistoryRecord,
} from '../types/medication'

/*
 * ============================================================
 * 正本データ
 *
 * usePills() を App.vue / useCloudData.ts などから
 * 複数回呼び出しても、同じ ref を共有する。
 * ============================================================
 */

const medicines = ref<Pill[]>([])
const historyList = ref<HistoryRecord[]>([])

/*
 * ============================================================
 * usePills
 * ============================================================
 */

export function usePills() {

  /**
   * 薬を追加
   */
  function addPill(data: NewPillData): Pill {

    const newPill: Pill = {
      id: Date.now().toString(),

      name: data.name,

      totalQuantity: data.totalQuantity,

      remainingQuantity: data.totalQuantity,

      dosagePerTake: data.dosagePerTake,

      prescriptionDate: data.prescriptionDate,

      todayRecord: false,
    }

    medicines.value.push(newPill)

    return newPill
  }

  /**
   * 薬を削除
   */
  function deletePill(
    id: string | number
  ): string {

    const index = medicines.value.findIndex(
      pill => String(pill.id) === String(id)
    )

    if (index === -1) {
      return ''
    }

    const name = medicines.value[index].name

    medicines.value.splice(index, 1)

    return name
  }

  /**
   * 今日の服薬状態を更新
   */
  function updateTodayRecord(
    id: string | number,
    status: boolean
  ): void {

    const pill = medicines.value.find(
      pill => String(pill.id) === String(id)
    )

    if (pill) {
      pill.todayRecord = status
    }
  }

  /**
   * 処方履歴から薬を再登録
   */
  function reorderPillsFromHistory(
    record: HistoryRecord
  ): Pill {

    return addPill({
      name: record.name,
      totalQuantity: record.totalQuantity,
      dosagePerTake: record.dosagePerTake,
      prescriptionDate: new Date()
        .toISOString()
        .substring(0, 10),
    })
  }

  /**
   * GASから取得した薬データを反映
   */
  function replacePills(
    newPills: Pill[]
  ): void {

    medicines.value = Array.isArray(newPills)
      ? newPills
      : []
  }

  /**
   * GASから取得した履歴データを反映
   */
  function replaceHistoryList(
    newHistoryList: HistoryRecord[]
  ): void {

    historyList.value = Array.isArray(newHistoryList)
      ? newHistoryList
      : []
  }

  /**
   * ログアウト時などに薬データをクリア
   */
  function clearPills(): void {
    medicines.value = []
  }

  /**
   * ログアウト時などに履歴をクリア
   */
  function clearHistoryList(): void {
    historyList.value = []
  }

  /**
   * 全データをクリア
   */
  function clearAll(): void {
    medicines.value = []
    historyList.value = []
  }

  return {
    medicines,
    historyList,

    addPill,
    deletePill,
    updateTodayRecord,
    reorderPillsFromHistory,

    replacePills,
    replaceHistoryList,

    clearPills,
    clearHistoryList,
    clearAll,
  }
}