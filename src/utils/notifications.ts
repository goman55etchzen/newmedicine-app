import type { AlertOptions } from '../types/medication';

export const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch((e) => console.warn('音声再生拒否:', e));
  } catch (e) {
    console.error('音声再生エラー:', e);
  }
};

export const triggerVibration = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
};

export const handleAlertTrigger = (title: string, body: string, options: AlertOptions) => {
  if (options.soundEnabled) {
    playNotificationSound();
  }
  if (options.vibrateEnabled) {
    triggerVibration();
  }
};