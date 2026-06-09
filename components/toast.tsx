'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-primary text-primary-foreground',
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-border/20 transition-all duration-300 ${
        colors[type]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300) }} className="opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
