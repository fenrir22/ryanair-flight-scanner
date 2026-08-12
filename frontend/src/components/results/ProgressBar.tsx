import React from 'react'
import type { SearchProgress } from '../../types'

interface ProgressBarProps {
  progress: SearchProgress
  onCancel: () => void
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, onCancel }) => {
  const percentage = progress.totalCombinations > 0
    ? Math.round((progress.processedCombinations / progress.totalCombinations) * 100)
    : 0

  const getStatusInfo = () => {
    switch (progress.status) {
      case 'scanning':
        return { text: 'Scansione in corso...', color: 'text-ryanair-yellow', icon: '🔍' }
      case 'completed':
        return { text: 'Scansione completata', color: 'text-green-400', icon: '✅' }
      case 'cancelled':
        return { text: 'Scansione annullata', color: 'text-orange-400', icon: '⚠️' }
      case 'error':
        return { text: 'Errore nella scansione', color: 'text-red-400', icon: '❌' }
      default:
        return { text: 'Preparazione...', color: 'text-gray-400', icon: '⏳' }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl"></div>
      <div className="absolute inset-0 border border-white/10 rounded-2xl"></div>
      
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{statusInfo.icon}</span>
            <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
              {statusInfo.text}
            </h3>
          </div>
          
          {progress.status === 'scanning' && (
            <button
              onClick={onCancel}
              className="button-secondary px-4 py-2 rounded-xl text-sm text-red-400 border-red-500/20 hover:bg-red-500/10 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Interrompi
            </button>
          )}
        </div>

        {/* Progress info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            <span className="text-white font-medium">{progress.processedCombinations}</span>
            <span className="text-gray-500"> / {progress.totalCombinations} combinazioni</span>
          </span>
          <span className="text-ryanair-yellow font-mono font-bold text-lg">
            {percentage}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-gray-800/50 rounded-full overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }}></div>
          </div>
          
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-ryanair-blue via-ryanair-yellow to-ryanair-light rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>

        {/* Best price */}
        {progress.bestPrice !== null && (
          <div className="flex items-center gap-3 p-3 bg-ryanair-yellow/5 border border-ryanair-yellow/10 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-ryanair-yellow" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500">Miglior prezzo trovato</div>
              <div className="text-xl font-bold text-gradient">
                {progress.bestPrice.toFixed(2)} {progress.bestResult?.currency || 'EUR'}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {progress.error && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <p className="text-sm text-red-300">{progress.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
