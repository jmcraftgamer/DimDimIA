'use client'

import { useEffect, useRef } from 'react'

const INTERVAL_MS = 8000

export default function BackgroundScraper() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function fireCron() {
      fetch('/api/cron', {
        method: 'GET',
        cache: 'no-store',
      }).catch(() => {})
    }

    fireCron()
    intervalRef.current = setInterval(fireCron, INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return null
}
