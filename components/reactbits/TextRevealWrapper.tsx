'use client'

import { motion } from 'framer-motion'

interface TextRevealWrapperProps {
  children: string
  className?: string
  color?: string
  duration?: number
}

export function TextRevealWrapper({
  children,
  className = '',
  color = '#004643',
  duration = 0.05,
}: TextRevealWrapperProps) {
  const words = children.split(' ')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: duration,
      },
    },
  }

  const wordVariants = {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          style={{ color }}
          className="inline-block"
        >
          {word}
          {index !== words.length - 1 && ' '}
        </motion.span>
      ))}
    </motion.span>
  )
}
