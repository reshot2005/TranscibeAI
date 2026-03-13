'use client'

import { motion, useScroll } from 'framer-motion'
import { useRef } from 'react'

interface ScrollProgressBarProps {
  color?: string
  height?: number
}

export function ScrollProgressBar({
  color = '#004643',
  height = 4,
}: ScrollProgressBarProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      ref={ref}
      className="fixed top-0 left-0 right-0 z-50 origin-left"
      style={{
        height: `${height}px`,
        backgroundColor: color,
        scaleX: scrollYProgress,
      }}
    />
  )
}
