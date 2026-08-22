// src/composables/medication.ts (usePills の提供)
import { ref } from 'vue'
import type { Pill, NewPillData, HistoryRecord } from '../types/medication'

export function usePills() {
  const medicines = ref<Pill[]>([])
  const historyList = ref<HistoryRecord[]>([])

  function addPill(data: NewPillData): Pill {
    const newPill: Pill = {
      id: Date.now().toString(),
      name: data.name,
      totalQuantity: data.totalQuantity,
      remainingQuantity: data.totalQuantity,
      dosagePerTake: data.dosagePerTake,
      prescriptionDate: data.prescriptionDate,
      todayRecord: false
    }
    medicines.value.push(newPill)
    return newPill
  }

  function deletePill(id: string | number): string {
    const index = medicines.value.findIndex(p => String(p.id) === String(id))
    let name = ''
    if (index !== -1) {
      name = medicines.value[index].name
      medicines.value.splice(index, 1)
    }
    return name
  }

  function updateTodayRecord(id: string | number, status: boolean) {
    const pill = medicines.value.find(p => String(p.id) === String(id))
    if (pill) {
      pill.todayRecord = status
    }
  }

  function reorderPillsFromHistory(record: HistoryRecord) {
    addPill({
      name: record.name,
      totalQuantity: record.totalQuantity,
      dosagePerTake: record.dosagePerTake,
      prescriptionDate: new Date().toISOString().substring(0, 10)
    })
  }

  return {
    medicines,
    historyList,
    addPill,
    deletePill,
    updateTodayRecord,
    reorderPillsFromHistory
  }
  // src/composables/medication.ts

/*
 * 旧パスとの互換用。
 *
 * usePills の本体は usePills.ts に一本化する。
 */

export { usePills } from './usePills'
}