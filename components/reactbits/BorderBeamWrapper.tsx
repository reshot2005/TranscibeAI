'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface BorderBeamWrapperProps {
  children: ReactNode
  className?: string
  borderColor?: string
}

export function BorderBeamWrapper({
  children,
  className = '',
  borderColor = '#F0EDE5',
}: BorderBeamWrapperProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Border beam container */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        {/* Top beam */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />

        {/* Right beam */}
        <motion.div
          className="absolute top-0 right-0 bottom-0 w-0.5"
          style={{
            background: `linear-gradient(180deg, transparent, ${borderColor}, transparent)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.5,
          }}
        />

        {/* Bottom beam */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1,
          }}
        />

        {/* Left beam */}
        <motion.div
          className="absolute top-0 left-0 bottom-0 w-0.5"
          style={{
            background: `linear-gradient(180deg, transparent, ${borderColor}, transparent)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1.5,
          }}
        />
      </div>

      {/* Static border */}
      <div
        className="absolute inset-0 rounded-lg border pointer-events-none"
        style={{
          borderColor: borderColor,
          borderWidth: '1px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
