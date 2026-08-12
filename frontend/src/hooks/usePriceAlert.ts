import { useState, useEffect, useCallback } from 'react'
import type { FlightResult } from '../types'

export interface PriceAlert {
  id: string
  origin: string
  destination: string
  maxPrice: number
  currency: string
  createdAt: number
  notified: boolean
}

const STORAGE_KEY = 'ryanair_price_alerts'

export function usePriceAlert() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [permissionGranted, setPermissionGranted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setAlerts(JSON.parse(stored))
      }
    } catch {
      // ignore
    }

    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }, [])

  const saveToStorage = useCallback((items: PriceAlert[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    
    if (Notification.permission === 'granted') {
      setPermissionGranted(true)
      return true
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      setPermissionGranted(permission === 'granted')
      return permission === 'granted'
    }
    
    return false
  }, [])

  const addAlert = useCallback((origin: string, destination: string, maxPrice: number, currency: string) => {
    const alert: PriceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      origin,
      destination,
      maxPrice,
      currency,
      createdAt: Date.now(),
      notified: false
    }

    setAlerts(prev => {
      const updated = [...prev, alert]
      saveToStorage(updated)
      return updated
    })

    return alert
  }, [saveToStorage])

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id)
      saveToStorage(updated)
      return updated
    })
  }, [saveToStorage])

  const checkAlerts = useCallback((results: FlightResult[]) => {
    if (!permissionGranted) return

    const triggeredAlerts: PriceAlert[] = []

    for (const alert of alerts) {
      if (alert.notified) continue

      const matchingFlights = results.filter(r =>
        r.origin === alert.origin &&
        r.destination === alert.destination &&
        r.totalPrice !== null &&
        r.totalPrice <= alert.maxPrice
      )

      if (matchingFlights.length > 0) {
        const bestPrice = Math.min(...matchingFlights.map(r => r.totalPrice!))
        triggeredAlerts.push(alert)

        new Notification(`Prezzo basso trovato! ${alert.origin} → ${alert.destination}`, {
          body: `Solo €${bestPrice.toFixed(2)} - sotto la tua soglia di €${alert.maxPrice.toFixed(2)}`,
          icon: '/vite.svg',
          tag: alert.id
        })
      }
    }

    if (triggeredAlerts.length > 0) {
      setAlerts(prev => {
        const updated = prev.map(a => {
          const triggered = triggeredAlerts.find(t => t.id === a.id)
          return triggered ? { ...a, notified: true } : a
        })
        saveToStorage(updated)
        return updated
      })
    }
  }, [alerts, permissionGranted, saveToStorage])

  const resetAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, notified: false } : a)
      saveToStorage(updated)
      return updated
    })
  }, [saveToStorage])

  return {
    alerts,
    permissionGranted,
    requestPermission,
    addAlert,
    removeAlert,
    checkAlerts,
    resetAlert
  }
}
