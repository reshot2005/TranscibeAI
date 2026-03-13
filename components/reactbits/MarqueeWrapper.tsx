'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface MarqueeWrapperProps {
  children: ReactNode
  className?: string
  speed?: number
  direction?: 'left' | 'right'
}

export function MarqueeWrapper({
  children,
  className = '',
  speed = 30,
  direction = 'left',
}: MarqueeWrapperProps) {
  const directionX = direction === 'left' ? -500 : 500

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{
          x: [0, directionX],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Original */}
        <div className="flex gap-8 items-center">{children}</div>

        {/* Duplicate for seamless loop */}
        <div className="flex gap-8 items-center">{children}</div>
      </motion.div>
    </div>
  )
}
