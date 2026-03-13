'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface MeteorsWrapperProps {
  children: ReactNode
  className?: string
  meteorColor?: string
  count?: number
}

export function MeteorsWrapper({
  children,
  className = '',
  meteorColor = '#F0EDE5',
  count = 20,
}: MeteorsWrapperProps) {
  const meteors = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    duration: Math.random() * 1 + 2,
    left: Math.random() * 100,
  }))

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Meteors */}
      <div className="absolute inset-0 pointer-events-none">
        {meteors.map((meteor) => (
          <motion.div
            key={meteor.id}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${meteor.left}%`,
              top: '-10px',
              backgroundColor: meteorColor,
              boxShadow: `0 0 10px ${meteorColor}`,
            }}
            animate={{
              y: ['-10px', '100vh'],
              opacity: [1, 0],
            }}
            transition={{
              duration: meteor.duration,
              repeat: Infinity,
              delay: meteor.delay,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
