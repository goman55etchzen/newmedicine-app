import { ref } from 'vue';
import type { ScheduleTimes, AlertOptions } from '../types/medication';

const scheduleTimes = ref<ScheduleTimes>({
  朝: '08:00',
  昼: '12:00',
  夜: '19:00',
  就寝前: '21:00',
});

const alertOptions = ref<AlertOptions>({
  popupEnabled: true,
  soundEnabled: true,
  vibrateEnabled: false,
});

export function useSettings() {
  const setScheduleTimes = (times: ScheduleTimes) => {
    scheduleTimes.value = { ...scheduleTimes.value, ...times };
  };

  const setAlertOptions = (options: AlertOptions) => {
    alertOptions.value = { ...alertOptions.value, ...options };
  };

  return {
    scheduleTimes,
    alertOptions,
    setScheduleTimes,
    setAlertOptions,
  };
}