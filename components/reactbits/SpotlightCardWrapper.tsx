'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface SpotlightCardWrapperProps {
  children: ReactNode
  className?: string
  spotlightColor?: string
  bgColor?: string
}

export function SpotlightCardWrapper({
  children,
  className = '',
  spotlightColor = '#00796B',
  bgColor = '#FFFFFF',
}: SpotlightCardWrapperProps) {
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    spotlightX: { current: number },
    spotlightY: { current: number }
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    spotlightX.current = e.clientX - rect.left
    spotlightY.current = e.clientY - rect.top
  }

  const spotlightX = { current: 0 }
  const spotlightY = { current: 0 }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg border border-gray-200 p-6 transition-all duration-300 ${className}`}
      style={{ backgroundColor: bgColor }}
      onMouseMove={(e) => handleMouseMove(e, spotlightX, spotlightY)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Spotlight gradient effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle 200px at ${spotlightX.current}px ${spotlightY.current}px, ${spotlightColor}20, transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
