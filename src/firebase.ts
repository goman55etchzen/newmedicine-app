import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';

import type {
  Pill,
  HistoryRecord,
  ScheduleTimes,
  AlertOptions,
} from './types/medication';

/* ============================================================
 * Configuration & Constants
 * ============================================================ */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAU6KOeCP1wgjx09om79qp6u6SedQAl2ME',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'medecine-app-501804.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'medecine-app-501804',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'medecine-app-501804.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '225106724498',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:225106724498:web:8b328b84805ce0ff5d484b',
};

export const GAS_WEB_APP_URL =
  import.meta.env.VITE_GAS_URL ||
  'https://script.google.com/macros/s/AKfycbxlQzqdXwYzlCAhgooEabC8g8yDVxb-Lr3XkLqM3EEGEDFQ2j7iajbdPgUJiRrjzGRnBA/exec';

const FCM_VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BNcd8Lgz74C-2HWfLNtsnwIS32N2MsYF_aQGWIaOvqE2ztp3GJz1TsxbXfCSzcYQRXAC_2VhxYznOf4WohYzObI';

/* ============================================================
 * Helper Utilities & Guest Logic (要件1, 6, 7)
 * ============================================================ */

export const normalizeUserId = (userId?: string | null): string => {
  const value = String(userId ?? '').trim().toLowerCase();
  return (!value || value === 'guest' || value === 'null' || value === 'undefined') ? 'Guest' : value;
};

export const isGuestUser = (userId?: string | null): boolean => normalizeUserId(userId) === 'Guest';

export const isBrowserEnv = (): boolean => typeof window !== 'undefined' && typeof navigator !== 'undefined';
export const isNotificationSupported = (): boolean => isBrowserEnv() && 'Notification' in window;
export const isServiceWorkerSupported = (): boolean => isBrowserEnv() && 'serviceWorker' in navigator;
export const isPushManagerSupported = (): boolean => isBrowserEnv() && 'PushManager' in window;

/* ============================================================
 * Firebase Initialization
 * ============================================================ */

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
let messaging: Messaging | null = null;

if (isBrowserEnv() && isServiceWorkerSupported()) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging 初期化スキップ:', error);
  }
}

export { messaging };

/* ============================================================
 * Types
 * ============================================================ */

export interface GASUserDataResponse {
  status?: string;
  message?: string;
  pills?: Pill[];
  historyList?: HistoryRecord[];
  scheduleTimes?: ScheduleTimes | null;
  alertOptions?: AlertOptions | null;
  lastUpdated?: number; // タイムスタンプ（要件4用）
  user?: { name: string; email: string };
  [key: string]: unknown;
}

/* ============================================================
 * Service Worker 登録・明示的取得 (要件5)
 * ============================================================ */

export const registerFirebaseServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!isBrowserEnv() || !isServiceWorkerSupported()) {
    throw new Error('Service Worker非対応の環境です。');
  }

  // 1. 既存の指定 Service Worker を確認・取得
  const registrations = await navigator.serviceWorker.getRegistrations();
  const targetSw = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw.js'));
  if (targetSw) return targetSw;

  // 2. なければ明示的に登録
  return await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
};

/* ============================================================
 * FCM Token & 通知関連 (要件2, 6)
 * ============================================================ */

const postToGAS = async (data: Record<string, unknown>): Promise<GASUserDataResponse> => {
  if (!GAS_WEB_APP_URL) throw new Error('GAS_WEB_APP_URL 未設定');
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`GAS HTTPエラー: ${response.status}`);
  return (await response.json()) as GASUserDataResponse;
};

export const saveTokenToGAS = async (token: string, userId: string = 'Guest'): Promise<boolean> => {
  const normToken = String(token ?? '').trim();
  const normUserId = normalizeUserId(userId);
  if (!normToken || normUserId === 'Guest') return false;

  try {
    const result = await postToGAS({
      action: 'saveToken',
      token: normToken,
      userId: normUserId,
    });
    return result.status === 'success';
  } catch (error) {
    console.error('GAS FCM Token 保存失敗:', error);
    return false;
  }
};

export const initializeFCM = async (userId: string): Promise<string | null> => {
  const normUserId = normalizeUserId(userId);
  if (
    normUserId === 'Guest' ||
    !isNotificationSupported() ||
    !isServiceWorkerSupported() ||
    !isPushManagerSupported() ||
    !messaging
  ) {
    return null;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return null;

    const registration = await registerFirebaseServiceWorker();
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await saveTokenToGAS(token, normUserId);
      return token;
    }
  } catch (error) {
    console.warn('FCM 初期化失敗:', error);
  }
  return null;
};

export const onForegroundMessage = (callback: (payload: MessagePayload) => void): (() => void) => {
  if (!isBrowserEnv() || !messaging) return () => {};
  return onMessage(messaging, callback);
};

/* ============================================================
 * クラウド（GAS）データ通信 (要件1, 4)
 * ============================================================ */

export const getUserDataFromGAS = async (userId: string): Promise<GASUserDataResponse | null> => {
  const normUserId = normalizeUserId(userId);
  if (normUserId === 'Guest') return null;

  try {
    const url = `${GAS_WEB_APP_URL}?action=getData&userId=${encodeURIComponent(normUserId)}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) throw new Error(`GAS Fetchエラー: HTTP ${response.status}`);
    const result = (await response.json()) as GASUserDataResponse;
    return result.status === 'success' ? result : null;
  } catch (error) {
    console.error('GAS データ取得失敗:', error);
    return null;
  }
};

export const syncDataToGAS = async (
  userId: string,
  data: {
    pills?: Pill[];
    historyList?: HistoryRecord[];
    scheduleTimes?: ScheduleTimes;
    alertOptions?: AlertOptions;
    lastUpdated?: number;
  }
): Promise<boolean> => {
  const normUserId = normalizeUserId(userId);
  if (normUserId === 'Guest') return false;

  try {
    const result = await postToGAS({
      action: 'syncData',
      userId: normUserId,
      pills: Array.isArray(data.pills) ? data.pills : [],
      historyList: Array.isArray(data.historyList) ? data.historyList : [],
      scheduleTimes: data.scheduleTimes,
      alertOptions: data.alertOptions,
      lastUpdated: data.lastUpdated || Date.now(),
    });
    return result.status === 'success';
  } catch (error) {
    console.error('GAS データ同期失敗:', error);
    return false;
  }
};