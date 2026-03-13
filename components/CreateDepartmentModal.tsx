'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { CYPRUS, SAND } from '@/lib/constants'

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export function CreateDepartmentModal({
  isOpen,
  onClose,
  onCreate,
}: CreateDepartmentModalProps) {
  const [departmentName, setDepartmentName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!departmentName.trim()) {
      setError('Department name is required')
      return
    }
    onCreate(departmentName)
    setDepartmentName('')
    setError('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div
              className="bg-white rounded-lg shadow-xl p-6"
              style={{ borderTop: `4px solid ${CYPRUS[700]}` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: CYPRUS[700] }}>
                  Create Department
                </h2>
                <motion.button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} style={{ color: CYPRUS[700] }} />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: CYPRUS[700] }}
                  >
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => {
                      setDepartmentName(e.target.value)
                      setError('')
                    }}
                    placeholder="e.g., HR, Tech, Marketing"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    style={{ focusBorderColor: CYPRUS[700] }}
                    autoFocus
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                {/* Common Options */}
                <div className="grid grid-cols-3 gap-2 my-4">
                  {['HR', 'Tech', 'Marketing'].map((dept) => (
                    <motion.button
                      key={dept}
                      type="button"
                      onClick={() => setDepartmentName(dept)}
                      className="px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-cyan-600 transition-all font-medium text-sm"
                      style={{
                        backgroundColor:
                          departmentName === dept ? CYPRUS[700] : 'transparent',
                        color:
                          departmentName === dept ? SAND[900] : CYPRUS[700],
                        borderColor:
                          departmentName === dept ? CYPRUS[700] : 'rgb(229, 231, 235)',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {dept}
                    </motion.button>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 font-medium hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: CYPRUS[700] }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
