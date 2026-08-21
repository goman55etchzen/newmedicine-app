import { ref } from 'vue';
import { getUserDataFromGAS, syncDataToGAS, normalizeUserId, isGuestUser } from '../firebase';
import { usePills } from './usePills';
import { useSettings } from './useSettings';

const isLoading = ref<boolean>(false);
const LOCAL_STORAGE_KEY_TIMESTAMP = 'med_app_last_updated';

export function useCloudData() {
  const { medicines: pills, historyList } = usePills(); // Pills / History の正本（要件3）
  const { scheduleTimes, alertOptions, setScheduleTimes, setAlertOptions } = useSettings();

  const getLocalTimestamp = (): number => {
    const ts = localStorage.getItem(LOCAL_STORAGE_KEY_TIMESTAMP);
    return ts ? parseInt(ts, 10) : 0;
  };

  const setLocalTimestamp = (ts: number): void => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TIMESTAMP, String(ts));
  };

  /**
   * クラウドとローカルのタイムスタンプ比較・照合同期（要件4）
   */
  const fetchCloudData = async (userId: string) => {
    const normUserId = normalizeUserId(userId);
    if (isGuestUser(normUserId)) return;

    isLoading.value = true;
    try {
      const cloudData = await getUserDataFromGAS(normUserId);
      if (!cloudData) return;

      const cloudTimestamp = cloudData.lastUpdated || 0;
      const localTimestamp = getLocalTimestamp();

      if (cloudTimestamp > localTimestamp) {
        // クラウドの方が新しい場合：ローカルへ適用
        if (Array.isArray(cloudData.pills)) pills.value = cloudData.pills;
        if (Array.isArray(cloudData.historyList)) historyList.value = cloudData.historyList;
        if (cloudData.scheduleTimes) setScheduleTimes(cloudData.scheduleTimes);
        if (cloudData.alertOptions) setAlertOptions(cloudData.alertOptions);

        setLocalTimestamp(cloudTimestamp);
      } else if (localTimestamp > cloudTimestamp) {
        // ローカルの方が新しい場合：クラウドへ保存・同期
        await saveDataToCloud(normUserId);
      }
    } catch (error) {
      console.error('データ同期照合エラー:', error);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * ローカルの正本データをクラウドへ押し出し同期（要件3, 4）
   */
  const saveDataToCloud = async (userId: string): Promise<boolean> => {
    const normUserId = normalizeUserId(userId);
    if (isGuestUser(normUserId)) return false;

    const now = Date.now();
    setLocalTimestamp(now);

    return await syncDataToGAS(normUserId, {
      pills: pills.value,
      historyList: historyList.value,
      scheduleTimes: scheduleTimes.value,
      alertOptions: alertOptions.value,
      lastUpdated: now,
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