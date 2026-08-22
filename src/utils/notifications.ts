// src/utils/notifications.ts

import { ref, type Ref } from 'vue'
import type {
  Pill,
  ScheduleTimes,
  AlertOptions,
} from '../types/medication'

/* ============================================================
 * 通知音
 * ============================================================ */

export const playNotificationSound = (): void => {
  try {
    const audio = new Audio('/notification.mp3')

    audio.currentTime = 0

    audio.play().catch((error) => {
      console.warn('通知音の再生に失敗しました:', error)
    })
  } catch (error) {
    console.error('通知音エラー:', error)
  }
}

/* ============================================================
 * バイブレーション
 * ============================================================ */

export const triggerVibration = (): void => {
  try {
    if (
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate([200, 100, 200])
    }
  } catch (error) {
    console.warn('バイブレーションエラー:', error)
  }
}

/* ============================================================
 * アラート実行
 * ============================================================ */

export const handleAlertTrigger = (
  title: string,
  body: string,
  options: AlertOptions
): void => {
  if (options.soundEnabled) {
    playNotificationSound()
  }

  if (options.vibrateEnabled) {
    triggerVibration()
  }

  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      })
    } catch (error) {
      console.warn('ブラウザ通知の表示に失敗しました:', error)
    }
  }
}

/* ============================================================
 * 時刻判定
 * ============================================================ */

const isCurrentTime = (targetTime: string): boolean => {
  if (!targetTime || !/^\d{2}:\d{2}$/.test(targetTime)) {
    return false
  }

  const now = new Date()

  const currentHour = String(now.getHours()).padStart(2, '0')
  const currentMinute = String(now.getMinutes()).padStart(2, '0')

  return `${currentHour}:${currentMinute}` === targetTime
}

/* ============================================================
 * 通知API (Composable)
 * ============================================================ */

export function useNotifications(
  currentUser: Ref<any>,
  pills: Ref<Pill[] | null | undefined>,
  scheduleTimes: Ref<ScheduleTimes>,
  alertOptions: Ref<AlertOptions>,
  onAlert?: (
    timing: keyof ScheduleTimes,
    targetPills: Pill[]
  ) => void
) {
  const isAlertOpen = ref(false)

  const alertTiming = ref<keyof ScheduleTimes | null>(null)

  const alertTargetPills = ref<Pill[]>([])

  let timerId: ReturnType<typeof setInterval> | null = null

  /*
   * 同じ分に何度も通知しないための管理
   */
  let lastTriggeredKey = ''

  /* ==========================================================
   * 対象薬取得
   * ========================================================== */

  const getTargetPills = (): Pill[] => {
    if (!pills.value) return []
    return pills.value.filter((pill) => {
      return !pill.todayRecord
    })
  }

  /* ==========================================================
   * アラート表示
   * ========================================================== */

  const showAlert = (timing: keyof ScheduleTimes): void => {
    const targetPills = getTargetPills()

    /*
     * 対象薬がない場合は通知しない
     */
    if (targetPills.length === 0) {
      return
    }

    alertTiming.value = timing
    alertTargetPills.value = [...targetPills]
    isAlertOpen.value = true

    handleAlertTrigger(
      '服薬のお知らせ',
      `${String(timing)}の服薬時間です。`,
      alertOptions.value
    )

    if (onAlert) {
      onAlert(timing, targetPills)
    }
  }

  /* ==========================================================
   * スケジュールチェック
   * ========================================================== */

  const checkAlertSchedule = (): void => {
    if (!currentUser.value) {
      return
    }

    if (!scheduleTimes.value) {
      return
    }

    const now = new Date()

    const dateKey = [
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
    ].join('-')

    /*
     * 同じ分の二重実行防止
     */
    if (lastTriggeredKey === dateKey) {
      return
    }

    const entries = Object.entries(scheduleTimes.value) as [
      keyof ScheduleTimes,
      string
    ][]

    for (const [timing, time] of entries) {
      if (isCurrentTime(time)) {
        lastTriggeredKey = dateKey
        showAlert(timing)
        break
      }
    }
  }

  /* ==========================================================
   * 開始
   * ========================================================== */

  const start = (): void => {
    if (timerId !== null) {
      return
    }

    checkAlertSchedule()

    timerId = setInterval(() => {
      checkAlertSchedule()
    }, 30_000)
  }

  /* ==========================================================
   * 停止
   * ========================================================== */

  const stop = (): void => {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  /* ==========================================================
   * 全て服用
   * ========================================================== */

  const takeAll = (): void => {
    const targetIds = new Set(
      alertTargetPills.value.map((pill) => String(pill.id))
    )

    if (pills.value) {
      pills.value.forEach((pill) => {
        if (targetIds.has(String(pill.id))) {
          pill.todayRecord = true
        }
      })
    }

    isAlertOpen.value = false
    alertTargetPills.value = []
    alertTiming.value = null
  }

  /* ==========================================================
   * スヌーズ
   * ========================================================== */

  const snoozeAlert = (): void => {
    isAlertOpen.value = false
  }

  /* ==========================================================
   * テスト通知
   * ========================================================== */

  const triggerTestAlert = (): void => {
    const targetPills = getTargetPills()

    alertTiming.value = '朝'
    alertTargetPills.value = [...targetPills]
    isAlertOpen.value = true

    handleAlertTrigger(
      '服薬テスト通知',
      targetPills.length > 0
        ? `${targetPills.length}件のお薬があります。`
        : '服薬通知のテストです。',
      alertOptions.value
    )
  }

  /* ==========================================================
   * 後始末
   * ========================================================== */

  const dispose = (): void => {
    stop()

    isAlertOpen.value = false
    alertTiming.value = null
    alertTargetPills.value = []

    lastTriggeredKey = ''
  }

  return {
    isAlertOpen,
    alertTiming,
    alertTargetPills,
    checkAlertSchedule,
    start,
    stop,
    takeAll,
    snoozeAlert,
    triggerTestAlert,
    dispose,
  }
}

// 互換性確保のためのエイリアス
export const notifications = useNotifications