import React, { useState } from 'react'
import type { SearchRequest } from '../../types'

interface ShareResultsProps {
  request: SearchRequest | null
}

export const ShareResults: React.FC<ShareResultsProps> = ({ request }) => {
  const [copied, setCopied] = useState(false)

  if (!request) return null

  const handleShare = async () => {
    const params = new URLSearchParams()
    params.set('o', request.origins.join(','))
    params.set('d', request.destinations.join(','))
    params.set('df', request.departureFrom)
    params.set('dt', request.departureTo)
    params.set('min', request.minStay.toString())
    params.set('max', request.maxStay.toString())
    params.set('p', request.passengers.toString())
    params.set('c', request.currency)
    params.set('t', request.tripType)

    const url = `${window.location.origin}?${params.toString()}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Scanner Voli Ryanair',
          text: 'Risultati ricerca voli Ryanair',
          url
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // fallback
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="button-secondary px-4 py-2 rounded-xl text-sm dark:text-gray-300 text-gray-700 flex items-center gap-2"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copiato!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Condividi
        </>
      )}
    </button>
  )
}
