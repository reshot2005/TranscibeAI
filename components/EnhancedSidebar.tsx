'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, FolderOpen } from 'lucide-react'
import { CYPRUS, SAND } from '@/lib/constants'
import { CreateDepartmentModal } from './CreateDepartmentModal'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export function EnhancedSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedRecordings, setExpandedRecordings] = useState(true)
  const [showCreateDept, setShowCreateDept] = useState(false)
  const [departments, setDepartments] = useState<
    { id: string; name: string; count: number; color: string }[]
  >([])

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    const load = async () => {
      const { data } = await supabase
        .from('departments')
        .select('id, name, recordings:recordings(id)')

      setDepartments(
        (data ?? []).map((d: any, idx: number) => ({
          id: d.id,
          name: d.name,
          count: d.recordings?.length ?? 0,
          color: CYPRUS[500 + ((idx % 3) * 100)] ?? CYPRUS[500],
        })),
      )
    }

    load()

    const channel = supabase
      .channel('sidebar-departments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recordings' },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const mainNavItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '📈', label: 'Analytics', href: '/dashboard/analytics' },
    { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
  ]

  const handleCreateDepartment = async (name: string) => {
    if (!name) return
    try {
      await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    } finally {
      setShowCreateDept(false)
    }
  }

  return (
    <>
      <motion.div
        className="fixed left-0 top-16 bottom-0 border-r border-border bg-background z-30 overflow-y-auto"
        style={{
          width: isCollapsed ? '80px' : '280px',
          backgroundColor: SAND[100],
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full p-4 flex justify-end"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronDown
            size={20}
            style={{
              color: CYPRUS[700],
              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          />
        </motion.button>

        {/* Main Navigation */}
        <div className="px-2 py-4 space-y-2">
          {mainNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/50 transition-colors cursor-pointer"
                whileHover={{ x: 5 }}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-2 my-4 border-t border-border/30" />

        {/* Recordings Section */}
        <div className="px-2">
          <motion.button
            onClick={() => setExpandedRecordings(!expandedRecordings)}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-white/50 transition-colors"
            whileHover={{ x: 5 }}
          >
            <FolderOpen size={18} style={{ color: CYPRUS[700] }} />
            {!isCollapsed && (
              <>
                <span className="font-semibold flex-1 text-left">Recordings</span>
                <motion.div
                  animate={{ rotate: expandedRecordings ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={16} style={{ color: CYPRUS[700] }} />
                </motion.div>
              </>
            )}
          </motion.button>

          {/* Departments List */}
          <AnimatePresence>
            {expandedRecordings && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 pl-2 space-y-1"
              >
                {departments.map((dept) => (
                  <Link key={dept.id} href={`/departments/${dept.id}`}>
                    <motion.div
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/70 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                        <span className="text-sm flex-1">{dept.name}</span>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{
                          backgroundColor: dept.color + '20',
                          color: dept.color,
                        }}
                      >
                        {dept.count}
                      </span>
                    </motion.div>
                  </Link>
                ))}

                {/* Create Department Button */}
                <motion.button
                  onClick={() => setShowCreateDept(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/70 transition-colors text-sm font-medium mt-3"
                  style={{ color: CYPRUS[700] }}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={16} />
                  <span>Create Department</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-white/30 backdrop-blur-sm">
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer hover:bg-white/50 transition-colors"
            whileHover={{ x: 5 }}
          >
            <span className="text-xl">👤</span>
            {!isCollapsed && <span className="text-sm font-medium">Profile</span>}
          </motion.div>
        </div>
      </motion.div>

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={showCreateDept}
        onClose={() => setShowCreateDept(false)}
        onCreate={handleCreateDepartment}
      />

      {/* Spacer */}
      <div style={{ marginLeft: isCollapsed ? '80px' : '280px', transition: 'margin-left 0.3s ease' }} />
    </>
  )
}
