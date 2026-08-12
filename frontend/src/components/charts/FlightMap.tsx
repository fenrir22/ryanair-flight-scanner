import React, { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from 'react-leaflet'
import type { FlightResult } from '../../types'
import 'leaflet/dist/leaflet.css'

interface FlightMapProps {
  results: FlightResult[]
}

const AIRPORT_COORDS: Record<string, [number, number]> = {
  'CTA': [37.4668, 15.0664], 'PMO': [38.1760, 13.0914], 'FCO': [41.8003, 12.2389],
  'MXP': [45.6306, 8.7281], 'BGY': [45.6740, 9.7048], 'VCE': [45.5053, 12.3519],
  'NAP': [40.8860, 14.2908], 'BRI': [41.1389, 16.7606], 'PSR': [42.4317, 14.1843],
  'BLQ': [44.5354, 11.2887], 'TRN': [45.2008, 7.6478], 'LIN': [45.4451, 9.2767],
  'STN': [51.8850, 0.2350], 'LTN': [51.8747, -0.3683], 'LGW': [51.1537, -0.1821],
  'MAN': [53.3537, -2.2750], 'BHX': [52.4539, -1.7480], 'EDI': [55.9500, -3.3725],
  'DUB': [53.4213, -6.2701], 'BCN': [41.2971, 2.0785], 'MAD': [40.4983, -3.5676],
  'PAL': [39.6462, 2.7331], 'AGP': [36.6749, -4.4990], 'TFS': [28.0445, -16.5725],
  'CDG': [49.0097, 2.5479], 'ORY': [48.7233, 2.3795], 'NCE': [43.6584, 7.2159],
  'MRS': [43.4393, 5.2214], 'FRA': [50.0379, 8.5622], 'BER': [52.3640, 13.5098],
  'CGN': [50.8686, 7.1427], 'DUS': [51.2895, 6.7668], 'AMS': [52.3105, 4.7683],
  'BRU': [50.9014, 4.4844], 'CPH': [55.6181, 12.6561], 'OSL': [60.1939, 11.1004],
  'ARN': [59.6519, 17.9416], 'HEL': [60.3172, 24.9668], 'WAW': [52.1657, 20.9671],
  'KRK': [50.0777, 19.7848], 'PRG': [50.1008, 14.2600], 'BUD': [47.4298, 19.2610],
  'VIE': [48.1103, 16.5697], 'ATH': [37.9364, 23.9445], 'MLA': [35.8575, 14.4775],
  'SOF': [42.6967, 23.4114], 'BUH': [44.5722, 26.1022], 'LIS': [38.7813, -9.1359],
  'OPO': [41.2481, -8.6814], 'TIA': [41.4147, 19.7206], 'ZAG': [45.7429, 16.0688],
  'SKG': [40.5203, 22.9709], 'HER': [35.3397, 25.1803], 'RHO': [36.4054, 28.0862],
  'CFU': [39.6019, 19.9118], 'CHQ': [35.5317, 24.1497], 'GDN': [54.3776, 18.4662],
  'KTW': [50.4743, 19.0800], 'WMI': [52.1307, 20.6518], 'RSO': [43.9019, 15.7397],
  'ZAD': [44.1069, 15.3467], 'SUF': [38.9054, 16.2423], 'REG': [38.0712, 15.6519],
  'LMP': [35.4979, 12.6180], 'PNL': [36.6528, 11.9110], 'CIY': [36.9779, 14.5763],
  'AOI': [43.6163, 13.3603], 'PEG': [43.0959, 12.5092],
  'CRV': [38.9972, 17.0802], 'BDS': [40.6576, 17.9470],
  'LCC': [40.2408, 18.1339],
}

export const FlightMap: React.FC<FlightMapProps> = ({ results }) => {
  const routeData = useMemo(() => {
    const routeMap = new Map<string, { 
      origin: string; destination: string; 
      originName: string; destinationName: string;
      minPrice: number; count: number; results: FlightResult[] 
    }>()

    results.forEach(r => {
      if (r.totalPrice === null) return
      const key = `${r.origin}-${r.destination}`
      const existing = routeMap.get(key)
      if (existing) {
        existing.minPrice = Math.min(existing.minPrice, r.totalPrice)
        existing.count++
        existing.results.push(r)
      } else {
        routeMap.set(key, {
          origin: r.origin,
          destination: r.destination,
          originName: r.originName,
          destinationName: r.destinationName,
          minPrice: r.totalPrice,
          count: 1,
          results: [r]
        })
      }
    })

    return Array.from(routeMap.values())
  }, [results])

  const airports = useMemo(() => {
    const map = new Map<string, { code: string; name: string; coords: [number, number]; isOrigin: boolean; isDestination: boolean }>()
    
    routeData.forEach(r => {
      const oCoords = AIRPORT_COORDS[r.origin]
      const dCoords = AIRPORT_COORDS[r.destination]
      
      if (oCoords && !map.has(r.origin)) {
        map.set(r.origin, { code: r.origin, name: r.originName, coords: oCoords, isOrigin: true, isDestination: false })
      }
      if (dCoords && !map.has(r.destination)) {
        map.set(r.destination, { code: r.destination, name: r.destinationName, coords: dCoords, isOrigin: false, isDestination: true })
      }
      if (oCoords && map.has(r.origin)) {
        map.get(r.origin)!.isOrigin = true
      }
      if (dCoords && map.has(r.destination)) {
        map.get(r.destination)!.isDestination = true
      }
    })

    return Array.from(map.values())
  }, [routeData])

  const allPrices = routeData.map(r => r.minPrice)
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0

  const getRouteColor = (price: number) => {
    if (maxPrice === minPrice) return '#ffb71b'
    const ratio = (price - minPrice) / (maxPrice - minPrice)
    if (ratio < 0.33) return '#22c55e'
    if (ratio < 0.66) return '#eab308'
    return '#ef4444'
  }

  const center: [number, number] = [41.9028, 12.4964]

  const validRoutes = routeData.filter(r => AIRPORT_COORDS[r.origin] && AIRPORT_COORDS[r.destination])

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
      <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white text-gray-900">Mappa delle Rotte</h3>
            <p className="text-xs dark:text-gray-500 text-gray-500">Visualizza le rotte e i prezzi sulla mappa</p>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border dark:border-white/10 border-gray-200" style={{ height: '400px' }}>
          <MapContainer
            center={center}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {airports.map(airport => (
              <CircleMarker
                key={airport.code}
                center={airport.coords}
                radius={8}
                pathOptions={{
                  color: airport.isOrigin ? '#22c55e' : '#ef4444',
                  fillColor: airport.isOrigin ? '#22c55e' : '#ef4444',
                  fillOpacity: 0.7,
                  weight: 2
                }}
              >
                <Tooltip>
                  <span className="font-bold">{airport.code}</span> - {airport.name}
                </Tooltip>
              </CircleMarker>
            ))}

            {validRoutes.map((route, idx) => {
              const oCoords = AIRPORT_COORDS[route.origin]
              const dCoords = AIRPORT_COORDS[route.destination]
              if (!oCoords || !dCoords) return null

              return (
                <Polyline
                  key={idx}
                  positions={[oCoords, dCoords]}
                  pathOptions={{
                    color: getRouteColor(route.minPrice),
                    weight: 2,
                    opacity: 0.6
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-bold">{route.origin} → {route.destination}</div>
                      <div>Da {route.minPrice.toFixed(2)}€</div>
                      <div className="text-xs text-gray-500">{route.count} risultat{route.count === 1 ? 'o' : 'i'}</div>
                    </div>
                  </Popup>
                </Polyline>
              )
            })}
          </MapContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Partenza</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Destinazione</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-green-500"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Economico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-yellow-500"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Medio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-500"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Alto</span>
          </div>
        </div>
      </div>
    </div>
  )
}
