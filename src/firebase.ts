// src/firebase.ts

import {
  initializeApp,
  getApps,
  getApp,
} from 'firebase/app'

import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging'

import type {
  Pill,
  HistoryRecord,
  ScheduleTimes,
  AlertOptions,
} from './types/medication'

/* ============================================================
 * Firebase Configuration
 * ============================================================ */

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || '',

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || '',

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || '',
}

/* ============================================================
 * GAS / FCM
 * ============================================================ */

export const GAS_WEB_APP_URL: string =
  import.meta.env.VITE_GAS_URL || ''

const FCM_VAPID_KEY: string =
  import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

/* ============================================================
 * User Utilities
 * ============================================================ */

export const normalizeUserId = (
  userId?: string | null
): string => {

  const value = String(
    userId ?? ''
  )
    .trim()
    .toLowerCase()

  if (
    !value ||
    value === 'guest' ||
    value === 'null' ||
    value === 'undefined'
  ) {
    return 'Guest'
  }

  return value
}

export const isGuestUser = (
  userId?: string | null
): boolean => {
  return normalizeUserId(userId) === 'Guest'
}

/* ============================================================
 * Browser Support
 * ============================================================ */

export const isBrowserEnv = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined'
  )
}

export const isNotificationSupported =
  (): boolean => {

    return (
      isBrowserEnv() &&
      typeof window.Notification !==
        'undefined'
    )
  }

export const isServiceWorkerSupported =
  (): boolean => {

    return (
      isBrowserEnv() &&
      'serviceWorker' in navigator
    )
  }

export const isPushManagerSupported =
  (): boolean => {

    return (
      isBrowserEnv() &&
      typeof window.PushManager !==
        'undefined'
    )
  }

/* ============================================================
 * Firebase Initialization
 * ============================================================ */

const isFirebaseConfigured =
  Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  )

const app =
  isFirebaseConfigured
    ? (
        getApps().length === 0
          ? initializeApp(firebaseConfig)
          : getApp()
      )
    : null

let messagingInstance:
  Messaging | null = null

if (
  app &&
  isBrowserEnv() &&
  isServiceWorkerSupported()
) {

  try {

    messagingInstance =
      getMessaging(app)

  } catch (error) {

    console.warn(
      'Firebase Messaging 初期化スキップ:',
      error
    )
  }
}

export const messaging:
  Messaging | null =
  messagingInstance

/* ============================================================
 * GAS Response
 * ============================================================ */

export interface GASUserDataResponse {
  status?: string
  message?: string

  pills?: Pill[]
  historyList?: HistoryRecord[]

  scheduleTimes?:
    | ScheduleTimes
    | null

  alertOptions?:
    | AlertOptions
    | null

  lastUpdated?: number

  user?: {
    name: string
    email: string
  }

  [key: string]: unknown
}

/* ============================================================
 * Service Worker
 * ============================================================ */

export const registerFirebaseServiceWorker =
  async (): Promise<ServiceWorkerRegistration> => {

    if (
      !isBrowserEnv() ||
      !isServiceWorkerSupported()
    ) {
      throw new Error(
        'Service Worker非対応の環境です。'
      )
    }

    const registrations =
      await navigator.serviceWorker
        .getRegistrations()

    const targetSw =
      registrations.find(
        registration => {

          const url =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            ''

          return url.includes(
            'firebase-messaging-sw.js'
          )
        }
      )

    if (targetSw) {

      if (!targetSw.active) {

        try {
          await navigator.serviceWorker.ready
        } catch (error) {
          console.warn(
            'Service Worker ready待機失敗:',
            error
          )
        }
      }

      return targetSw
    }

    return await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      {
        scope: '/',
      }
    )
  }

/* ============================================================
 * GAS POST
 * ============================================================ */

const postToGAS = async (
  data: Record<string, unknown>
): Promise<GASUserDataResponse> => {

  if (!GAS_WEB_APP_URL) {
    throw new Error(
      'VITE_GAS_URL が未設定です。'
    )
  }

  const response =
    await fetch(
      GAS_WEB_APP_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8',
        },

        body: JSON.stringify(data),
      }
    )

  if (!response.ok) {

    throw new Error(
      `GAS HTTPエラー: ${response.status}`
    )
  }

  return (
    await response.json()
  ) as GASUserDataResponse
}

/* ============================================================
 * FCM Token
 * ============================================================ */

export const saveTokenToGAS = async (
  token: string,
  userId: string = 'Guest'
): Promise<boolean> => {

  const normalizedToken =
    String(token ?? '').trim()

  const normalizedUserId =
    normalizeUserId(userId)

  if (
    !normalizedToken ||
    isGuestUser(normalizedUserId)
  ) {
    return false
  }

  try {

    const result =
      await postToGAS({
        action: 'saveToken',
        token: normalizedToken,
        userId: normalizedUserId,
      })

    return result.status === 'success'

  } catch (error) {

    console.error(
      'GAS FCM Token 保存失敗:',
      error
    )

    return false
  }
}

/* ============================================================
 * FCM Initialize
 * ============================================================ */

export const initializeFCM = async (
  userId: string
): Promise<string | null> => {

  const normalizedUserId =
    normalizeUserId(userId)

  if (
    isGuestUser(normalizedUserId) ||
    !isNotificationSupported() ||
    !isServiceWorkerSupported() ||
    !isPushManagerSupported() ||
    !messaging ||
    !FCM_VAPID_KEY
  ) {
    return null
  }

  try {

    let permission =
      window.Notification.permission

    if (permission === 'default') {

      permission =
        await window.Notification
          .requestPermission()
    }

    if (
      permission !== 'granted'
    ) {
      return null
    }

    const registration =
      await registerFirebaseServiceWorker()

    const token =
      await getToken(
        messaging,
        {
          vapidKey:
            FCM_VAPID_KEY,

          serviceWorkerRegistration:
            registration,
        }
      )

    if (!token) {
      return null
    }

    /*
     * Token取得成功だけでなく、
     * GAS保存成功まで確認する。
     */
    const saved =
      await saveTokenToGAS(
        token,
        normalizedUserId
      )

    if (!saved) {

      console.warn(
        'FCM TokenをGASへ保存できませんでした。'
      )

      return null
    }

    return token

  } catch (error) {

    console.warn(
      'FCM 初期化失敗:',
      error
    )

    return null
  }
}

/* ============================================================
 * Foreground Message
 * ============================================================ */

export const onForegroundMessage = (
  callback: (
    payload: MessagePayload
  ) => void
): (() => void) => {

  if (
    !isBrowserEnv() ||
    !messaging
  ) {
    return () => {}
  }

  return onMessage(
    messaging,
    callback
  )
}

/* ============================================================
 * GAS User Data
 * ============================================================ */

export const getUserDataFromGAS =
  async (
    userId: string
  ): Promise<
    GASUserDataResponse | null
  > => {

    const normalizedUserId =
      normalizeUserId(userId)

    if (
      isGuestUser(normalizedUserId) ||
      !GAS_WEB_APP_URL
    ) {
      return null
    }

    try {

      const url =
        `${GAS_WEB_APP_URL}` +
        `?action=getData` +
        `&userId=${encodeURIComponent(
          normalizedUserId
        )}`

      const response =
        await fetch(
          url,
          {
            method: 'GET',
          }
        )

      if (!response.ok) {

        throw new Error(
          `GAS Fetchエラー: HTTP ${response.status}`
        )
      }

      const result =
        (
          await response.json()
        ) as GASUserDataResponse

      return (
        result.status === 'success'
          ? result
          : null
      )

    } catch (error) {

      console.error(
        'GAS データ取得失敗:',
        error
      )

      return null
    }
  }

/* ============================================================
 * GAS Data Sync
 * ============================================================ */

export const syncDataToGAS = async (
  userId: string,
  data: {
    pills?: Pill[]
    historyList?: HistoryRecord[]
    scheduleTimes?: ScheduleTimes
    alertOptions?: AlertOptions
    lastUpdated?: number
  }
): Promise<boolean> => {

  const normalizedUserId =
    normalizeUserId(userId)

  if (
    isGuestUser(normalizedUserId) ||
    !GAS_WEB_APP_URL
  ) {
    return false
  }

  /*
   * デフォルト値。
   *
   * undefinedのままGASへ送らない。
   */
  const defaultScheduleTimes:
    ScheduleTimes = {
      朝: '08:00',
      昼: '12:00',
      夜: '19:00',
      就寝前: '21:00',
    }

  const defaultAlertOptions:
    AlertOptions = {
      popupEnabled: true,
      soundEnabled: true,
      vibrateEnabled: false,
    }

  try {

    const result =
      await postToGAS({
        action: 'syncData',

        userId:
          normalizedUserId,

        pills:
          Array.isArray(data.pills)
            ? data.pills
            : [],

        historyList:
          Array.isArray(
            data.historyList
          )
            ? data.historyList
            : [],

        scheduleTimes:
          data.scheduleTimes ??
          defaultScheduleTimes,

        alertOptions:
          data.alertOptions ??
          defaultAlertOptions,

        lastUpdated:
          Number.isFinite(
            data.lastUpdated
          )
            ? data.lastUpdated
            : Date.now(),
      })

    return result.status === 'success'

  } catch (error) {

    console.error(
      'GAS データ同期失敗:',
      error
    )

    return false
  }
}