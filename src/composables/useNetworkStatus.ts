import { ref, onMounted, onUnmounted } from 'vue';
import { useCloudData } from './useCloudData';
import { useAuth } from './useAuth';

export function useNetworkStatus() {
  const isOnline = ref<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { saveDataToCloud } = useCloudData();
  const { currentUser } = useAuth();

  const handleOnline = async () => {
    isOnline.value = true;
    // オフラインから復帰時、ログイン中であればローカルの正本データをGASへ追いつかせる
    if (currentUser.value?.email) {
      await saveDataToCloud(currentUser.value.email);
    }
  };

  const handleOffline = () => {
    isOnline.value = false;
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  });

  return {
    isOnline,
  };
}