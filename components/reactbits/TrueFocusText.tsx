'use client'

import { motion } from 'framer-motion'

interface TrueFocusTextProps {
  children: string
  className?: string
  color?: string
}

export function TrueFocusText({
  children,
  className = '',
  color = '#F0EDE5',
}: TrueFocusTextProps) {
  const words = children.split(' ')

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.3 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: i * 0.1 }}
          style={{ color }}
          className="relative"
        >
          {word}{' '}
        </motion.span>
      ))}
    </span>
  )
}
