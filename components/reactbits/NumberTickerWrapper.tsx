'use client'

import { useEffect, useState } from 'react'

interface NumberTickerWrapperProps {
  value: number
  className?: string
  color?: string
  prefix?: string
  suffix?: string
  duration?: number
}

export function NumberTickerWrapper({
  value,
  className = '',
  color = '#004643',
  prefix = '',
  suffix = '',
  duration = 2,
}: NumberTickerWrapperProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const target = value
    const increment = target / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setDisplayValue(target)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, duration])

  return (
    <span className={className} style={{ color }}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}
