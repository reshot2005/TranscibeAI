'use client'

import { motion } from 'framer-motion'
import { ReactNode, useState } from 'react'

interface GlowingEffectWrapperProps {
  children: ReactNode
  className?: string
  glowColor?: string
  bgColor?: string
}

export function GlowingEffectWrapper({
  children,
  className = '',
  glowColor = '#00796B',
  bgColor = '#FFFFFF',
}: GlowingEffectWrapperProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`relative rounded-lg overflow-hidden transition-all duration-300 ${className}`}
      style={{
        backgroundColor: bgColor,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        boxShadow: isHovered
          ? `0 0 30px 0 ${glowColor}40, 0 0 60px 0 ${glowColor}20`
          : `0 0 10px 0 ${glowColor}20`,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 opacity-0"
        style={{
          background: `radial-gradient(circle, ${glowColor}20 0%, transparent 70%)`,
        }}
        animate={{
          opacity: isHovered ? 0.5 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
