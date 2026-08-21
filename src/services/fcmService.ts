import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

let messaging: Messaging | null = null
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && firebaseConfig.apiKey) {
  try {
    messaging = getMessaging(app)
  } catch (e) {
    console.warn('FCM Messaging initialization skipped:', e)
  }
}

export async function initializeFCM(userEmail: string): Promise<string | null> {
  if (!messaging || !('Notification' in window)) {
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: firebaseConfig.vapidKey
    })

    if (token) {
      console.log(`FCM token generated for ${userEmail}:`, token)
      return token
    }
  } catch (error) {
    console.warn('FCM initialization error:', error)
  }
  return null
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return
  return onMessage(messaging, callback)
}