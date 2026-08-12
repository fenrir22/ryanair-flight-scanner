import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'saved_searches.db')

// Ensure data directory exists
import fs from 'fs'
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS saved_searches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    origins TEXT NOT NULL,
    destinations TEXT NOT NULL,
    departure_from TEXT NOT NULL,
    departure_to TEXT NOT NULL,
    min_stay INTEGER NOT NULL,
    max_stay INTEGER NOT NULL,
    passengers INTEGER NOT NULL DEFAULT 1,
    currency TEXT NOT NULL DEFAULT 'EUR',
    trip_type TEXT NOT NULL DEFAULT 'round-trip',
    max_price REAL,
    ntfy_topic TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    price REAL,
    message TEXT,
    FOREIGN KEY (search_id) REFERENCES saved_searches(id)
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    return_date TEXT,
    min_price REAL NOT NULL,
    avg_price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_price_history_route ON price_history(origin, destination);
  CREATE INDEX IF NOT EXISTS idx_price_history_dates ON price_history(departure_date, return_date);
`)

export interface SavedSearch {
  id: string
  user_id: string
  name: string
  origins: string[]
  destinations: string[]
  departure_from: string
  departure_to: string
  min_stay: number
  max_stay: number
  passengers: number
  currency: string
  trip_type: 'round-trip' | 'one-way'
  max_price: number | null
  ntfy_topic: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export function createSavedSearch(search: Omit<SavedSearch, 'id' | 'created_at' | 'updated_at'>): SavedSearch {
  const id = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const stmt = db.prepare(`
    INSERT INTO saved_searches (
      id, user_id, name, origins, destinations, departure_from, departure_to,
      min_stay, max_stay, passengers, currency, trip_type, max_price, ntfy_topic,
      enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    id,
    search.user_id,
    search.name,
    JSON.stringify(search.origins),
    JSON.stringify(search.destinations),
    search.departure_from,
    search.departure_to,
    search.min_stay,
    search.max_stay,
    search.passengers,
    search.currency,
    search.trip_type,
    search.max_price,
    search.ntfy_topic,
    search.enabled ? 1 : 0,
    now,
    now
  )
  
  return { ...search, id, created_at: now, updated_at: now }
}

export function getSavedSearches(userId?: string): SavedSearch[] {
  let stmt
  if (userId) {
    stmt = db.prepare('SELECT * FROM saved_searches WHERE user_id = ?')
    return stmt.all(userId).map(row => parseRow(row))
  } else {
    stmt = db.prepare('SELECT * FROM saved_searches')
    return stmt.all().map(row => parseRow(row))
  }
}

export function getSavedSearch(id: string): SavedSearch | null {
  const stmt = db.prepare('SELECT * FROM saved_searches WHERE id = ?')
  const row = stmt.get(id)
  return row ? parseRow(row) : null
}

export function updateSavedSearch(id: string, updates: Partial<SavedSearch>): SavedSearch | null {
  const search = getSavedSearch(id)
  if (!search) return null
  
  const now = new Date().toISOString()
  const updated = { ...search, ...updates, updated_at: now }
  
  const stmt = db.prepare(`
    UPDATE saved_searches SET
      name = ?, origins = ?, destinations = ?, departure_from = ?, departure_to = ?,
      min_stay = ?, max_stay = ?, passengers = ?, currency = ?, trip_type = ?,
      max_price = ?, ntfy_topic = ?, enabled = ?, updated_at = ?
    WHERE id = ?
  `)
  
  stmt.run(
    updated.name,
    JSON.stringify(updated.origins),
    JSON.stringify(updated.destinations),
    updated.departure_from,
    updated.departure_to,
    updated.min_stay,
    updated.max_stay,
    updated.passengers,
    updated.currency,
    updated.trip_type,
    updated.max_price,
    updated.ntfy_topic,
    updated.enabled ? 1 : 0,
    now,
    id
  )
  
  return updated
}

export function deleteSavedSearch(id: string): boolean {
  const stmt = db.prepare('DELETE FROM saved_searches WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function recordNotification(searchId: string, price: number | null, message: string): void {
  const stmt = db.prepare('INSERT INTO notifications (search_id, price, message) VALUES (?, ?, ?)')
  stmt.run(searchId, price, message)
}

export interface PriceHistoryEntry {
  origin: string
  destination: string
  departure_date: string
  return_date: string | null
  min_price: number
  avg_price: number
  currency: string
  recorded_at: string
}

export function recordPriceHistory(entries: Omit<PriceHistoryEntry, 'recorded_at'>[]): void {
  const stmt = db.prepare(`
    INSERT INTO price_history (origin, destination, departure_date, return_date, min_price, avg_price, currency, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `)
  
  const insertMany = db.transaction((items: Omit<PriceHistoryEntry, 'recorded_at'>[]) => {
    for (const entry of items) {
      stmt.run(entry.origin, entry.destination, entry.departure_date, entry.return_date, entry.min_price, entry.avg_price, entry.currency)
    }
  })
  
  insertMany(entries)
}

export function getPriceHistory(
  origin: string,
  destination: string,
  days: number = 30
): PriceHistoryEntry[] {
  const stmt = db.prepare(`
    SELECT * FROM price_history 
    WHERE origin = ? AND destination = ? 
    AND recorded_at >= datetime('now', '-' || ? || ' days')
    ORDER BY recorded_at ASC
  `)
  return stmt.all(origin, destination, days) as PriceHistoryEntry[]
}

export function getRoutePriceHistory(days: number = 30): PriceHistoryEntry[] {
  const stmt = db.prepare(`
    SELECT * FROM price_history 
    WHERE recorded_at >= datetime('now', '-' || ? || ' days')
    ORDER BY recorded_at ASC
  `)
  return stmt.all(days) as PriceHistoryEntry[]
}

function parseRow(row: any): SavedSearch {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    origins: JSON.parse(row.origins),
    destinations: JSON.parse(row.destinations),
    departure_from: row.departure_from,
    departure_to: row.departure_to,
    min_stay: row.min_stay,
    max_stay: row.max_stay,
    passengers: row.passengers,
    currency: row.currency,
    trip_type: row.trip_type,
    max_price: row.max_price,
    ntfy_topic: row.ntfy_topic,
    enabled: row.enabled === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}
