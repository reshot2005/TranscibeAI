'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface MorphingTextWrapperProps {
  words: string[]
  className?: string
  color?: string
  duration?: number
}

export function MorphingTextWrapper({
  words,
  className = '',
  color = '#004643',
  duration = 3,
}: MorphingTextWrapperProps) {
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
    >
      {words[index]}
    </motion.span>
  )
}
