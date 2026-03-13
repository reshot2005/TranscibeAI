'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode } from 'react'

interface FadeTextLinkProps {
  href: string
  children: ReactNode
  className?: string
  color?: string
}

export function FadeTextLink({
  href,
  children,
  className = '',
  color = '#004643',
}: FadeTextLinkProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <Link
        href={href}
        className={className}
        style={{ color }}
      >
        <motion.span
          whileHover={{ opacity: 0.7 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.span>
      </Link>
    </motion.div>
  )
}
