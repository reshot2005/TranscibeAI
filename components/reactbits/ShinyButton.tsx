'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ShinyButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  bgColor?: string
  textColor?: string
  variant?: 'primary' | 'secondary'
}

export function ShinyButton({
  children,
  onClick,
  className = '',
  bgColor = '#004643',
  textColor = '#F0EDE5',
  variant = 'primary',
}: ShinyButtonProps) {
  return (
    <motion.button
      className={`relative px-6 py-3 font-semibold rounded-lg overflow-hidden transition-all duration-300 ${className}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      onClick={onClick}
      whileHover={{
        scale: 1.05,
      }}
      whileTap={{
        scale: 0.95,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 -left-full"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
        }}
        animate={{
          left: '100%',
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.button>
  )
}
