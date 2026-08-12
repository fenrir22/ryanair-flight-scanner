import React, { useRef, useState } from 'react'
import type { SavedSearch } from '../../types'

interface SavedSearchImportExportProps {
  searches: SavedSearch[]
  onImport: (searches: SavedSearch[]) => void
}

export const SavedSearchImportExport: React.FC<SavedSearchImportExportProps> = ({ searches, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      searches
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ryanair-saved-searches-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (data.searches && Array.isArray(data.searches)) {
          onImport(data.searches)
          setImportStatus('success')
          setTimeout(() => setImportStatus('idle'), 3000)
        } else {
          throw new Error('Formato file non valido')
        }
      } catch (err) {
        setImportStatus('error')
        setTimeout(() => setImportStatus('idle'), 3000)
      }
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={searches.length === 0}
        className="button-secondary px-3 py-1.5 rounded-lg text-sm dark:text-gray-300 text-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Esporta ricerche salvate"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Esporta
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="button-secondary px-3 py-1.5 rounded-lg text-sm dark:text-gray-300 text-gray-700 flex items-center gap-2"
        title="Importa ricerche salvate"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Importa
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      {importStatus === 'success' && (
        <span className="text-xs text-green-500 animate-fade-in">Importato!</span>
      )}
      {importStatus === 'error' && (
        <span className="text-xs text-red-500 animate-fade-in">Errore!</span>
      )}
    </div>
  )
}
