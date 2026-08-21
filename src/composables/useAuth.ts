// src/composables/useAuth.ts
import { ref } from 'vue'
import type { User } from '../types/medication'

export interface AuthUser extends User {
  token?: string
}

const currentUser = ref<AuthUser | null>(null)
const authPage = ref<'login' | 'register'>('login')

export function useAuth() {
  function setUser(user: AuthUser) {
    currentUser.value = user
    localStorage.setItem('app_user', JSON.stringify(user))
  }

  function restoreUser(): AuthUser | null {
    const saved = localStorage.getItem('app_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        currentUser.value = parsed
        return parsed
      } catch {
        localStorage.removeItem('app_user')
      }
    }
    return null
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('app_user')
  }

  async function updateUser(updatedData: User): Promise<boolean> {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...updatedData }
      localStorage.setItem('app_user', JSON.stringify(currentUser.value))
      return true
    }
    return false
  }

  return {
    currentUser,
    authPage,
    setUser,
    restoreUser,
    logout,
    updateUser
  }
}