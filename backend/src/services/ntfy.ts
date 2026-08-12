import { logger } from '../logger.js'

const NTFY_URL = process.env.NTFY_URL || 'https://ntfy.sh'

export interface NtfyNotification {
  topic: string
  title: string
  message: string
  priority?: 1 | 2 | 3 | 4 | 5
  tags?: string[]
  click?: string
  actions?: any[]
}

export async function sendNtfyNotification(notification: NtfyNotification): Promise<boolean> {
  try {
    const url = `${NTFY_URL}/${notification.topic}`
    
    const headers: Record<string, string> = {
      'Title': notification.title,
      'Priority': String(notification.priority || 3),
    }
    
    if (notification.tags?.length) {
      headers['Tags'] = notification.tags.join(',')
    }
    
    if (notification.click) {
      headers['Click'] = notification.click
    }
    
    if (notification.actions?.length) {
      headers['Actions'] = JSON.stringify(notification.actions)
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: notification.message
    })
    
    if (!response.ok) {
      logger.error({ status: response.status, topic: notification.topic }, 'Failed to send ntfy notification')
      return false
    }
    
    logger.info({ topic: notification.topic, title: notification.title }, 'Ntfy notification sent')
    return true
  } catch (error: any) {
    logger.error({ error: error.message, topic: notification.topic }, 'Error sending ntfy notification')
    return false
  }
}

export async function sendFlightAlert(
  topic: string,
  searchName: string,
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | null,
  price: number,
  currency: string,
  bookingUrl: string
): Promise<boolean> {
  const formatDate = (date: string) => {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }
  
  const currencySymbol = currency === 'EUR' ? '€' : currency
  
  const message = returnDate
    ? `${formatDate(departureDate)} → ${formatDate(returnDate)}`
    : `${formatDate(departureDate)} (solo andata)`
  
  return sendNtfyNotification({
    topic,
    title: `✈️ ${searchName}: ${currencySymbol}${price.toFixed(2)}`,
    message: `${origin} → ${destination}\n${message}`,
    priority: 4,
    tags: ['airplane_departure'],
    click: bookingUrl,
    actions: [
      {
        action: 'view',
        label: 'Prenota ora',
        url: bookingUrl
      }
    ]
  })
}
