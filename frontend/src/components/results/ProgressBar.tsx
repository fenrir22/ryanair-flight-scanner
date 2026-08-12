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

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">
          {progress.status === 'scanning' && 'Scansione in corso...'}
          {progress.status === 'completed' && 'Scansione completata'}
          {progress.status === 'cancelled' && 'Scansione annullata'}
          {progress.status === 'error' && 'Errore nella scansione'}
          {progress.status === 'pending' && 'Preparazione scansione...'}
        </h3>
        {progress.status === 'scanning' && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
          >
            Interrompi scansione
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span>{progress.processedCombinations} / {progress.totalCombinations} combinazioni</span>
        <span className="text-ryanair-yellow font-mono">{percentage}%</span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-ryanair-blue to-ryanair-yellow rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {progress.bestPrice !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Miglior prezzo trovato:</span>
          <span className="text-ryanair-yellow font-bold text-lg">
            {progress.bestPrice.toFixed(2)} {progress.bestResult?.currency || 'EUR'}
          </span>
        </div>
      )}

      {progress.error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg p-3">
          {progress.error}
        </div>
      )}
    </div>
  )
}
