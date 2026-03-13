'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface TypingAnimationWrapperProps {
  text: string
  className?: string
  color?: string
  speed?: number
}

export function TypingAnimationWrapper({
  text,
  className = '',
  color = '#004643',
  speed = 50,
}: TypingAnimationWrapperProps) {
  const [displayText, setDisplayText] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[index])
        setIndex(index + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else {
      // Reset after completion
      const resetTimer = setTimeout(() => {
        setDisplayText('')
        setIndex(0)
      }, 2000)
      return () => clearTimeout(resetTimer)
    }
  }, [index, text, speed])

  return (
    <motion.span
      className={className}
      style={{ color }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayText}
      {index < text.length && (
        <motion.span
          animate={{ opacity: [0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block"
        >
          |
        </motion.span>
      )}
    </motion.span>
  )
}
