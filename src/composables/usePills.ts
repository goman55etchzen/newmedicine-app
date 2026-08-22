// src/composables/usePills.ts

import { ref } from 'vue'
import type {
  Pill,
  NewPillData,
  HistoryRecord,
} from '../types/medication'

/*
 * ============================================================
 * 共有状態
 *
 * usePills() を何回呼んでも同じデータを使用する
 * ============================================================
 */

const medicines = ref<Pill[]>([])
const historyList = ref<HistoryRecord[]>([])

/* ============================================================
 * Composable
 * ============================================================ */

export function usePills() {

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

  function deletePill(id: string | number): string {
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

  function updateTodayRecord(
    id: string | number,
    status: boolean
  ): void {
    const pill = medicines.value.find(
      pill => String(pill.id) === String(id)
    )

    if (!pill) {
      return
    }

    pill.todayRecord = status
  }

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

  return {
    medicines,
    historyList,
    addPill,
    deletePill,
    updateTodayRecord,
    reorderPillsFromHistory,
  }
}