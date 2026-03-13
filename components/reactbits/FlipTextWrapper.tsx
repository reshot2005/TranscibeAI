'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface FlipTextWrapperProps {
  words: string[]
  className?: string
  color?: string
  duration?: number
}

export function FlipTextWrapper({
  words,
  className = '',
  color = '#004643',
  duration = 3,
}: FlipTextWrapperProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, duration * 1000)
    return () => clearInterval(interval)
  }, [words, duration])

  return (
    <motion.span
      className={className}
      style={{ color }}
      key={index}
      initial={{ rotateX: 90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      exit={{ rotateX: -90, opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {words[index]}
    </motion.span>
  )
}
