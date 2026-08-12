# Ryanair Flight Scanner

Self-hosted web application to find the cheapest Ryanair flight date combinations.

Scan all possible departure/return date pairs within a configurable range, sort by price, and find the best deal.

## Architecture

```
Browser :8080
    |
  Nginx (reverse proxy)
    |
    +-- /api/* --> Backend (Fastify :3000)
    |                  |
    |                  +-- Ryanair Adapter
    |                  |      |
    |                  |      +-- @2bad/ryanair v8.1.0
    |                  |             |
    |                  |             +-- Ryanair API
    |                  |
    |                  +-- Cache (in-memory, TTL configurable)
    |                  +-- Scanner (concurrency-limited queue)
    |
    +-- /* --> Frontend (React SPA via Nginx)
```

### Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, TypeScript, Fastify 5 |
| Ryanair client | @2bad/ryanair v8.1.0 |
| Validation | Zod |
| Frontend | React 19, Vite 6, TailwindCSS 3 |
| Charts | Recharts |
| Proxy | Nginx 1.27 |
| Deployment | Docker, Docker Compose |

## Requirements

- Docker >= 24
- Docker Compose >= 2.20

## Installation

```bash
git clone <repo-url>
cd ryanair-flight-scanner
cp .env.example .env
```

## Configuration

Edit `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment |
| `PORT` | `3000` | Backend port |
| `MARKET` | `it-it` | Ryanair market (e.g., `it-it`, `en-gb`, `de-de`, `es-es`) |
| `MAX_CONCURRENT_REQUESTS` | `3` | Max parallel Ryanair API calls |
| `REQUEST_TIMEOUT` | `15000` | Request timeout in ms |
| `MAX_RETRIES` | `2` | Max retries per request |
| `CACHE_TTL` | `300` | Cache TTL in seconds |
| `DEFAULT_CURRENCY` | `EUR` | Default currency |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed CORS origin |
| `NTFY_URL` | `https://ntfy.sh` | Ntfy server URL for notifications |
| `SCAN_INTERVAL` | `86400000` | Scheduler interval in ms (default: 24h) |

### Markets

By default the app uses the Italian market (`it-it`). This means:
- API calls go to `https://www.ryanair.com/api/booking/v4/it-it/availability`
- Booking links redirect to `https://www.ryanair.com/it-it/booking?...`
- Prices are in EUR

To use a different market, change `MARKET` in `.env`. The currency will still follow the `DEFAULT_CURRENCY` setting or the per-search `currency` parameter.

### Notifications with Ntfy

The app supports sending notifications via [Ntfy](https://ntfy.sh), a simple pub-sub notification service.

**Setup:**
1. Choose a unique topic name (e.g., `my-ryanair-deals-123`)
2. Subscribe to the topic on your device:
   - **Android/iOS**: Download the ntfy app from Play Store/App Store and subscribe to your topic
   - **Web**: Visit https://ntfy.sh and subscribe to your topic
   - **Self-hosted**: Set `NTFY_URL` to your ntfy server URL
3. Create a saved search in the app and set the same topic name
4. The scheduler will automatically scan for deals and send notifications when prices match your criteria

**Notification content:**
- Flight route and dates
- Price
- Direct link to book on Ryanair
- Sent only when deals are found within your price range

## Usage

```bash
docker compose up -d
```

Open http://localhost:8080

### Search

1. Select one or more departure airports (e.g., CTA, PMO)
2. Select one or more destination airports (e.g., STN, LTN)
3. Set departure date range
4. Set min/max stay duration
5. Click "SEARCH FLIGHTS"

The scanner generates all valid date combinations and queries Ryanair for each, with concurrency control and rate limiting.

### Results

- Sorted by price (cheapest first)
- Filter by airport
- Sort by cheapest, duration, departure date, or price per day
- Click "View flight" to open Ryanair booking page
- Toggle price chart to visualize min/avg prices by departure date

### Cancel

Click "Stop scan" to cancel an in-progress search. Completed results are kept.

### Saved Searches

Create saved searches to receive daily notifications about flight deals:

1. Click "+ Nuova Ricerca" in the Saved Searches section
2. Fill in the search criteria:
   - **Name**: A descriptive name for your search
   - **Airports**: Origin and destination airports
   - **Date range**: When you want to travel
   - **Stay duration**: Min/max days for your trip
   - **Trip type**: Round-trip or one-way
   - **Max price**: Optional price threshold
   - **Ntfy topic**: Your ntfy topic for notifications
3. Save the search
4. The scheduler runs every 24 hours and sends notifications when deals are found

You can:
- **Enable/disable** searches without deleting them
- **Delete** searches you no longer need
- **Edit** search criteria by creating a new search

## API

### `GET /api/health`

Health check.

### `GET /api/airports?q=<query>`

Search airports by name, city, or IATA code.

### `GET /api/airports/:code/destinations`

Get available destinations from an airport.

### `POST /api/search`

Start a new search.

```json
{
  "origins": ["CTA"],
  "destinations": ["STN"],
  "departureFrom": "2026-09-01",
  "departureTo": "2026-09-30",
  "minStay": 3,
  "maxStay": 7,
  "passengers": 1,
  "currency": "EUR"
}
```

Response: `{ "searchId": "search_xxx" }`

### `GET /api/search/:id`

Get search progress and results.

### `GET /api/search/:id/stream`

SSE stream for real-time progress updates.

### `POST /api/search/:id/cancel`

Cancel an in-progress search.

### `GET /api/saved-searches`

Get all saved searches. Optional query parameter `user_id` to filter by user.

### `POST /api/saved-searches`

Create a new saved search.

```json
{
  "user_id": "user123",
  "name": "Summer vacation",
  "origins": ["CTA"],
  "destinations": ["STN", "LTN"],
  "departure_from": "2026-06-01",
  "departure_to": "2026-08-31",
  "min_stay": 7,
  "max_stay": 14,
  "passengers": 2,
  "currency": "EUR",
  "trip_type": "round-trip",
  "max_price": 200,
  "ntfy_topic": "my-ryanair-deals",
  "enabled": true
}
```

### `PUT /api/saved-searches/:id`

Update a saved search.

### `DELETE /api/saved-searches/:id`

Delete a saved search.

## Troubleshooting

### No results

- Ryanair may not operate the requested route
- Dates may be too far in the future (Ryanair typically opens bookings ~1 year ahead)
- Check Docker logs: `docker compose logs backend`

### Rate limiting / 429 errors

The scanner automatically backs off with exponential retry. Reduce `MAX_CONCURRENT_REQUESTS` if needed.

### 409 Availability declined

The Ryanair client version pin has expired. The library auto-refreshes it. If the issue persists, set `RYANAIR_CLIENT_VERSION` env var to the current Ryanair web build version.

### Slow scans

Large date ranges x multiple airports = many combinations. Example: 30 days x 5 stay options x 3 origins x 2 destinations = 900 requests. With 3 concurrent = ~300 sequential batches.

## Limitations

- Depends on `@2bad/ryanair` which wraps unofficial Ryanair APIs
- Ryanair may change or block their APIs at any time
- No booking capability -- links redirect to ryanair.com
- Prices are point-in-time and may change immediately after verification
- No CAPTCHA handling; heavy use may trigger Ryanair's bot detection

## Dependency on @2bad/ryanair

This project uses `@2bad/ryanair` v8.1.0 as the primary interface to Ryanair's API. All integration is isolated in `backend/src/adapters/ryanair/`. If Ryanair changes their API, only the adapter needs updating.

Methods used:
- `airports.getActive()` -- airport list for autocomplete
- `airports.getDestinations()` -- available destinations from an airport
- `fares.findDailyFaresInRange()` -- daily fare overview (available for future use)
- `flights.getDates()` -- available flight dates (available for future use)

**Note:** `flights.getAvailable()` is **not** used directly because the library hardcodes the `en-gb` market in the booking API URL. Instead, the adapter makes direct HTTP calls to `https://www.ryanair.com/api/booking/v4/{market}/availability` with the configurable market (default: `it-it`). The client-version header auto-refresh logic from the library is replicated in the adapter.

## Credits

This project is built on top of [@2bad/ryanair](https://github.com/2BAD/ryanair), an unofficial TypeScript client for the Ryanair API. Special thanks to the 2BAD team for creating and maintaining this excellent library.

Original work: [2BAD/ryanair](https://github.com/2BAD/ryanair) - MIT License

## License

MIT
