'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpNumberProps {
  end: number
  start?: number
  duration?: number
  className?: string
  color?: string
  prefix?: string
  suffix?: string
}

export function CountUpNumber({
  end,
  start = 0,
  duration = 2,
  className = '',
  color = '#004643',
  prefix = '',
  suffix = '',
}: CountUpNumberProps) {
  const [count, setCount] = useState(start)
  const ref = useRef(null)
  const hasStarted = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true
          let current = start
          const range = end - start
          const increment = range / (duration * 60)

          const timer = setInterval(() => {
            current += increment
            if (current >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, 16)

          return () => clearInterval(timer)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [start, end, duration])

  return (
    <span ref={ref} className={className} style={{ color }}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}
