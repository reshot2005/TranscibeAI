'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedListWrapperProps {
  items: ReactNode[]
  className?: string
  stagger?: number
}

export function AnimatedListWrapper({
  items,
  className = '',
  stagger = 0.1,
}: AnimatedListWrapperProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.div key={index} variants={itemVariants}>
          {item}
        </motion.div>
      ))}
    </motion.div>
  )
}
