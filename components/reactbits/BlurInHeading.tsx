'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface BlurInHeadingProps {
  children: ReactNode
  className?: string
  color?: string
}

export function BlurInHeading({
  children,
  className = '',
  color = '#004643',
}: BlurInHeadingProps) {
  return (
    <motion.div
      className={className}
      style={{ color }}
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
