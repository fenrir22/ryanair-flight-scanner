import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

interface KeyboardShortcutInfo {
  keys: string[]
  description: string
}

export const KeyboardShortcutsHelp: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (showHelp) {
      const originalStyle = document.body.style.cssText
      document.body.style.cssText = 'overflow: hidden; position: fixed; width: 100%; top: 0;'
      return () => {
        document.body.style.cssText = originalStyle
      }
    }
  }, [showHelp])

  const shortcuts: KeyboardShortcutInfo[] = [
    { keys: ['Ctrl', 'K'], description: 'Focus su ricerca aeroporti' },
    { keys: ['Esc'], description: 'Chiudi modali/filtri' },
    { keys: ['/'], description: 'Focus rapido su ricerca' },
    { keys: ['Ctrl', 'Shift', 'R'], description: 'Aggiorna risultati' },
    { keys: ['?'], description: 'Mostra/nascondi aiuto' }
  ]

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="button-secondary p-2 rounded-xl"
        aria-label="Scorciatoie tastiera"
        title="Scorciatoie tastiera (?)"
      >
        <svg className="w-5 h-5 dark:text-gray-300 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {showHelp && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowHelp(false)}
          />
          {/* Modal container */}
          <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl pointer-events-auto">
              <div className="absolute inset-0 dark:bg-gray-900 bg-white"></div>
              <div className="absolute inset-0 border dark:border-gray-700 border-gray-300 rounded-2xl"></div>
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold dark:text-white text-gray-900">Scorciatoie Tastiera</h2>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="button-secondary p-2 rounded-xl"
                    aria-label="Chiudi"
                  >
                    <svg className="w-5 h-5 dark:text-gray-300 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  {shortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl dark:bg-gray-800/50 bg-gray-100">
                      <span className="text-sm dark:text-gray-300 text-gray-700">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            <kbd className="px-2 py-1 text-xs font-mono font-bold dark:bg-gray-700 bg-gray-200 dark:text-gray-200 text-gray-800 rounded border dark:border-gray-600 border-gray-300">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-xs dark:text-gray-500 text-gray-400 self-center">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
