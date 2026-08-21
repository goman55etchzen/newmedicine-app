const STORAGE_KEYS = {
    USER: 'med_app_user',
    PILLS: 'med_app_pills',
    HISTORY: 'med_app_history',
    SETTINGS: 'med_app_settings'
  } as const
  
  export const storageService = {
    get<T>(key: keyof typeof STORAGE_KEYS, defaultValue: T): T {
      try {
        const data = localStorage.getItem(STORAGE_KEYS[key])
        return data ? JSON.parse(data) : defaultValue
      } catch {
        return defaultValue
      }
    },
  
    set<T>(key: keyof typeof STORAGE_KEYS, value: T): void {
      try {
        localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value))
      } catch (error) {
        console.error('storageService.set Error:', error)
      }
    },
  
    remove(key: keyof typeof STORAGE_KEYS): void {
      try {
        localStorage.removeItem(STORAGE_KEYS[key])
      } catch (error) {
        console.error('storageService.remove Error:', error)
      }
    },
  
    clearAll(): void {
      try {
        Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k))
      } catch (error) {
        console.error('storageService.clearAll Error:', error)
      }
    }
  }