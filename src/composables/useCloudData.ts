// src/composables/useCloudData.ts

import { ref } from 'vue'

import {
  getUserDataFromGAS,
  syncDataToGAS,
  normalizeUserId,
  isGuestUser,
} from '../firebase'

import { usePills } from './usePills'
import { useSettings } from './useSettings'

const isLoading = ref(false)

const LOCAL_STORAGE_KEY_TIMESTAMP =
  'med_app_last_updated'

export function useCloudData() {

  /*
   * usePills は共有状態なので
   * App.vue と同じ medicines / historyList を参照する
   */
  const {
    medicines: pills,
    historyList,
  } = usePills()

  const {
    scheduleTimes,
    alertOptions,
    setScheduleTimes,
    setAlertOptions,
  } = useSettings()

  const getLocalTimestamp = (): number => {
    if (typeof window === 'undefined') {
      return 0
    }

    const value = localStorage.getItem(
      LOCAL_STORAGE_KEY_TIMESTAMP
    )

    if (!value) {
      return 0
    }

    const timestamp = Number(value)

    return Number.isFinite(timestamp)
      ? timestamp
      : 0
  }

  const setLocalTimestamp = (timestamp: number): void => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(
      LOCAL_STORAGE_KEY_TIMESTAMP,
      String(timestamp)
    )
  }

  /* ==========================================================
   * クラウド → ローカル
   * ローカル → クラウド
   * ========================================================== */

  const fetchCloudData = async (
    userId: string
  ): Promise<void> => {

    const normalizedUserId =
      normalizeUserId(userId)

    if (isGuestUser(normalizedUserId)) {
      return
    }

    isLoading.value = true

    try {
      const cloudData =
        await getUserDataFromGAS(normalizedUserId)

      if (!cloudData) {
        return
      }

      const cloudTimestamp =
        Number(cloudData.lastUpdated || 0)

      const localTimestamp =
        getLocalTimestamp()

      /*
       * 初回取得
       */
      if (
        cloudTimestamp === 0 &&
        localTimestamp === 0
      ) {
        if (Array.isArray(cloudData.pills)) {
          pills.value = cloudData.pills
        }

        if (Array.isArray(cloudData.historyList)) {
          historyList.value =
            cloudData.historyList
        }

        if (cloudData.scheduleTimes) {
          setScheduleTimes(
            cloudData.scheduleTimes
          )
        }

        if (cloudData.alertOptions) {
          setAlertOptions(
            cloudData.alertOptions
          )
        }

        setLocalTimestamp(Date.now())

        return
      }

      /*
       * クラウドの方が新しい
       */
      if (cloudTimestamp > localTimestamp) {

        if (Array.isArray(cloudData.pills)) {
          pills.value = cloudData.pills
        }

        if (Array.isArray(cloudData.historyList)) {
          historyList.value =
            cloudData.historyList
        }

        if (cloudData.scheduleTimes) {
          setScheduleTimes(
            cloudData.scheduleTimes
          )
        }

        if (cloudData.alertOptions) {
          setAlertOptions(
            cloudData.alertOptions
          )
        }

        setLocalTimestamp(cloudTimestamp)

        return
      }

      /*
       * ローカルの方が新しい
       */
      if (localTimestamp > cloudTimestamp) {
        await saveDataToCloud(
          normalizedUserId
        )
      }

    } catch (error) {
      console.error(
        'データ同期照合エラー:',
        error
      )
    } finally {
      isLoading.value = false
    }
  }

  /* ==========================================================
   * ローカル → クラウド
   * ========================================================== */

  const saveDataToCloud = async (
    userId: string
  ): Promise<boolean> => {

    const normalizedUserId =
      normalizeUserId(userId)

    if (isGuestUser(normalizedUserId)) {
      return false
    }

    const now = Date.now()

    const success =
      await syncDataToGAS(
        normalizedUserId,
        {
          pills: pills.value,
          historyList: historyList.value,
          scheduleTimes:
            scheduleTimes.value,
          alertOptions:
            alertOptions.value,
          lastUpdated: now,
        }
      )

    /*
     * GAS保存成功時だけ
     * ローカルタイムスタンプを更新
     */
    if (success) {
      setLocalTimestamp(now)
    }

    return success
  }

  return {
    pills,
    historyList,
    isLoading,
    fetchCloudData,
    saveDataToCloud,
  }
}