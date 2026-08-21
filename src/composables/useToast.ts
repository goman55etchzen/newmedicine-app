import { ref } from 'vue';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const toastState = ref<ToastState>({
  show: false,
  message: '',
  type: 'info',
});

let timer: number | null = null;

export function useToast() {
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    if (timer) clearTimeout(timer);
    toastState.value = { show: true, message, type };
    
    timer = window.setTimeout(() => {
      toastState.value.show = false;
    }, duration);
  };

  return {
    toastState,
    showToast,
  };
}