import { ref } from 'vue';
import { getUserDataFromGAS, syncDataToGAS } from '../firebase';
import { useSettings } from './useSettings';
import type { Pill, HistoryRecord } from '../types/medication';

const pills = ref<Pill[]>([]);
const historyList = ref<HistoryRecord[]>([]);
const isLoading = ref<boolean>(false);

export function useCloudData() {
  const { setScheduleTimes, setAlertOptions, scheduleTimes, alertOptions } = useSettings();

  // GASから最新データを読み込み照合
  const fetchCloudData = async (userId: string) => {
    if (!userId || userId === 'Guest') return;
    isLoading.value = true;
    try {
      const data = await getUserDataFromGAS(userId);
      if (data) {
        if (Array.isArray(data.pills)) pills.value = data.pills;
        if (Array.isArray(data.historyList)) historyList.value = data.historyList;
        if (data.scheduleTimes) setScheduleTimes(data.scheduleTimes);
        if (data.alertOptions) setAlertOptions(data.alertOptions);
      }
    } catch (error) {
      console.error('データ照合取得エラー:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // クラウドへデータを同期・保存
  const saveDataToCloud = async (userId: string) => {
    if (!userId || userId === 'Guest') return false;
    return await syncDataToGAS(userId, {
      pills: pills.value,
      historyList: historyList.value,
      scheduleTimes: scheduleTimes.value,
      alertOptions: alertOptions.value,
    });
  };

  return {
    pills,
    historyList,
    isLoading,
    fetchCloudData,
    saveDataToCloud,
  };
}