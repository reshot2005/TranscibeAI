'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CYPRUS, SAND } from '@/lib/constants'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    {
      icon: '📊',
      label: 'Dashboard',
      href: '/dashboard',
      badge: null,
    },
    {
      icon: '📝',
      label: 'Recordings',
      href: '/dashboard/recordings',
      badge: '12',
    },
    {
      icon: '📈',
      label: 'Analytics',
      href: '/dashboard/analytics',
      badge: null,
    },
    {
      icon: '🎯',
      label: 'Insights',
      href: '/dashboard/insights',
      badge: '3 new',
    },
    {
      icon: '⚙️',
      label: 'Settings',
      href: '/dashboard/settings',
      badge: null,
    },
    {
      icon: '👥',
      label: 'Team',
      href: '/dashboard/team',
      badge: '5',
    },
  ]

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      className="h-screen flex flex-col border-r sticky top-0"
      style={{
        backgroundColor: CYPRUS[900],
        borderColor: `${SAND[900]}30`,
      }}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: `${SAND[900]}30` }}>
        {!isCollapsed && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold"
            style={{ color: SAND[900] }}
          >
            VV
          </motion.h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-opacity-10"
          style={{ color: SAND[900] }}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item, idx) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <Link
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-opacity-20"
              style={{
                color: SAND[900],
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${SAND[900]}20`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between flex-1 min-w-0"
                >
                  <span className="truncate text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full shrink-0 ml-2"
                      style={{
                        backgroundColor: CYPRUS[500],
                        color: SAND[900],
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              )}
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4 space-y-3" style={{ borderColor: `${SAND[900]}30` }}>
        <button
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium"
          style={{
            color: SAND[900],
            backgroundColor: `${SAND[900]}10`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${SAND[900]}20`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${SAND[900]}10`
          }}
        >
          <span>👤</span>
          {!isCollapsed && <span>Profile</span>}
        </button>
        <button
          onClick={() => (window.location.href = '/login')}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium"
          style={{
            color: SAND[900],
            backgroundColor: `${SAND[900]}10`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${SAND[900]}20`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${SAND[900]}10`
          }}
        >
          <span>🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  )
}
