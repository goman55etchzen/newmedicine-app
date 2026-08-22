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

const LOCAL_STORAGE_KEY_PREFIX =
  'med_app_last_updated_'

export function useCloudData() {

  /*
   * usePills は共有state。
   *
   * App.vue と同じ medicines / historyList を参照する。
   */
  const {
    medicines: pills,
    historyList,
    replacePills,
    replaceHistoryList,
  } = usePills()

  const {
    scheduleTimes,
    alertOptions,
    setScheduleTimes,
    setAlertOptions,
  } = useSettings()

  /*
   * ユーザーごとにlocalStorageを分離する。
   */
  const getStorageKey = (
    userId: string
  ): string => {

    const normalizedUserId =
      normalizeUserId(userId)

    return `${LOCAL_STORAGE_KEY_PREFIX}${normalizedUserId}`
  }

  /*
   * ローカル更新日時を取得
   */
  const getLocalTimestamp = (
    userId: string
  ): number => {

    if (
      typeof localStorage === 'undefined'
    ) {
      return 0
    }

    const value = localStorage.getItem(
      getStorageKey(userId)
    )

    if (!value) {
      return 0
    }

    const timestamp = Number(value)

    return Number.isFinite(timestamp)
      ? timestamp
      : 0
  }

  /*
   * ローカル更新日時を保存
   */
  const setLocalTimestamp = (
    userId: string,
    timestamp: number
  ): void => {

    if (
      typeof localStorage === 'undefined'
    ) {
      return
    }

    localStorage.setItem(
      getStorageKey(userId),
      String(timestamp)
    )
  }

  /*
   * ==========================================================
   * GAS → Local / Local → GAS
   * ==========================================================
   */
  const fetchCloudData = async (
    userId: string
  ): Promise<void> => {

    const normalizedUserId =
      normalizeUserId(userId)

    if (
      isGuestUser(normalizedUserId)
    ) {
      return
    }

    isLoading.value = true

    try {

      const cloudData =
        await getUserDataFromGAS(
          normalizedUserId
        )

      if (!cloudData) {
        return
      }

      const cloudTimestamp =
        Number(
          cloudData.lastUpdated ?? 0
        )

      const localTimestamp =
        getLocalTimestamp(
          normalizedUserId
        )

      /*
       * ------------------------------------------
       * GASの方が新しい
       * ------------------------------------------
       */
      if (
        cloudTimestamp >
        localTimestamp
      ) {

        if (
          Array.isArray(cloudData.pills)
        ) {
          replacePills(
            cloudData.pills
          )
        }

        if (
          Array.isArray(
            cloudData.historyList
          )
        ) {
          replaceHistoryList(
            cloudData.historyList
          )
        }

        if (
          cloudData.scheduleTimes
        ) {
          setScheduleTimes(
            cloudData.scheduleTimes
          )
        }

        if (
          cloudData.alertOptions
        ) {
          setAlertOptions(
            cloudData.alertOptions
          )
        }

        setLocalTimestamp(
          normalizedUserId,
          cloudTimestamp
        )

        return
      }

      /*
       * ------------------------------------------
       * ローカルの方が新しい
       * ------------------------------------------
       */
      if (
        localTimestamp >
        cloudTimestamp
      ) {

        await saveDataToCloud(
          normalizedUserId
        )

        return
      }

      /*
       * ------------------------------------------
       * 初回同期
       *
       * 両方ともtimestamp=0の場合、
       * GASにデータがあれば読み込む。
       * ------------------------------------------
       */
      if (
        localTimestamp === 0 &&
        cloudTimestamp === 0
      ) {

        if (
          Array.isArray(cloudData.pills)
        ) {
          replacePills(
            cloudData.pills
          )
        }

        if (
          Array.isArray(
            cloudData.historyList
          )
        ) {
          replaceHistoryList(
            cloudData.historyList
          )
        }

        if (
          cloudData.scheduleTimes
        ) {
          setScheduleTimes(
            cloudData.scheduleTimes
          )
        }

        if (
          cloudData.alertOptions
        ) {
          setAlertOptions(
            cloudData.alertOptions
          )
        }
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

  /*
   * ==========================================================
   * Local → GAS
   * ==========================================================
   */
  const saveDataToCloud = async (
    userId: string
  ): Promise<boolean> => {

    const normalizedUserId =
      normalizeUserId(userId)

    if (
      isGuestUser(normalizedUserId)
    ) {
      return false
    }

    const now = Date.now()

    try {

      /*
       * GASへの保存成功を確認してから
       * localStorageのtimestampを更新する。
       */
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

      if (success) {

        setLocalTimestamp(
          normalizedUserId,
          now
        )
      }

      return success

    } catch (error) {

      console.error(
        'クラウド保存エラー:',
        error
      )

      return false
    }
  }

  return {
    pills,
    historyList,
    isLoading,

    fetchCloudData,
    saveDataToCloud,
  }
}