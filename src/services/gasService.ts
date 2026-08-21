const GAS_ENDPOINT = import.meta.env.VITE_GAS_API_URL || ''

export interface SyncPayload {
  email: string
  pills?: any[]
  historyList?: any[]
  scheduleTimes?: any
  alertOptions?: any
}

export const gasService = {
  /**
   * クラウドデータを取得
   */
  async fetchData(email: string) {
    if (!GAS_ENDPOINT) return null
    try {
      const res = await fetch(`${GAS_ENDPOINT}?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Failed to fetch from GAS')
      return await res.json()
    } catch (error) {
      console.error('gasService.fetchData Error:', error)
      return null
    }
  },

  /**
   * クラウドデータを同期・保存
   */
  async syncData(payload: SyncPayload) {
    if (!GAS_ENDPOINT) return false
    try {
      const res = await fetch(GAS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'sync', ...payload })
      })
      return res.ok
    } catch (error) {
      console.error('gasService.syncData Error:', error)
      return false
    }
  },

  /**
   * お問い合わせメール送信
   */
  async sendContactMail(email: string, body: string) {
    if (!GAS_ENDPOINT) return false
    try {
      const res = await fetch(GAS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'contact', email, body })
      })
      return res.ok
    } catch (error) {
      console.error('gasService.sendContactMail Error:', error)
      return false
    }
  }
}