'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

interface DockItem {
  id: string
  label: string
  icon: string
  href?: string
}

interface DockNavigationProps {
  items: DockItem[]
  bgColor?: string
  iconColor?: string
  visibleAt?: number
}

export function DockNavigation({
  items,
  bgColor = '#004643',
  iconColor = '#F0EDE5',
  visibleAt = 500,
}: DockNavigationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const dockRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > visibleAt
      setIsVisible(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visibleAt])

  if (!isVisible) return null

  return (
    <motion.div
      ref={dockRef}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-2 px-4 py-3 rounded-full shadow-lg backdrop-blur-md"
      style={{
        backgroundColor: `${bgColor}E6`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((item) => (
        <motion.a
          key={item.id}
          href={item.href || '#'}
          className="relative cursor-pointer flex items-center justify-center"
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Magnifying glass effect */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              backgroundColor: iconColor,
              opacity: 0,
              filter: 'blur(0px)',
            }}
            animate={{
              opacity: hoveredId === item.id ? 0.15 : 0,
              scale: hoveredId === item.id ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Icon */}
          <motion.span
            className="relative z-10 text-2xl"
            animate={{
              scale: hoveredId === item.id ? 1.2 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            {item.icon}
          </motion.span>

          {/* Tooltip */}
          {hoveredId === item.id && (
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-sm font-medium whitespace-nowrap"
              style={{
                backgroundColor: bgColor,
                color: iconColor,
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.label}
            </motion.div>
          )}
        </motion.a>
      ))}
    </motion.div>
  )
}
