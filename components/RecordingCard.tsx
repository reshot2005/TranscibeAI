'use client'

import { motion } from 'framer-motion'
import { Trash2, Volume2, Clock, User } from 'lucide-react'
import { CYPRUS, SAND } from '@/lib/constants'

interface Recording {
  id: string
  memberId: string
  memberName: string
  title: string
  duration: string
  transcription: string
  uploadedAt: string
  thumbnail?: string
}

interface RecordingCardProps {
  recording: Recording
  onDelete: () => void
}

export function RecordingCard({ recording, onDelete }: RecordingCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <motion.div
      className="bg-white rounded-lg border-2 border-border overflow-hidden hover:border-cyan-400 transition-colors group"
      whileHover={{ y: -4 }}
      layout
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b border-border"
        style={{ backgroundColor: CYPRUS[50] }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold" style={{ color: CYPRUS[700] }}>
              {recording.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <User size={14} />
              <span>{recording.memberName}</span>
              <span className="text-gray-300">•</span>
              <Clock size={14} />
              <span>{recording.uploadedAt}</span>
            </div>
          </div>
          <motion.button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 size={18} className="text-red-500" />
          </motion.button>
        </div>

        {/* Duration Badge */}
        <div className="flex items-center gap-2 w-fit">
          <Volume2
            size={14}
            style={{ color: CYPRUS[600] }}
          />
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              backgroundColor: CYPRUS[100],
              color: CYPRUS[700],
            }}
          >
            {recording.duration}
          </span>
        </div>
      </div>

      {/* Transcription */}
      <div className="px-6 py-4">
        <div className="mb-2 flex items-center gap-2">
          <Volume2 size={16} style={{ color: CYPRUS[700] }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: CYPRUS[700] }}>
            Transcription
          </span>
        </div>
        <p
          className="text-sm leading-relaxed text-muted-foreground line-clamp-4 hover:line-clamp-none cursor-pointer transition-all"
          title={recording.transcription}
        >
          {recording.transcription}
        </p>
        {recording.transcription.length > 200 && (
          <button
            className="mt-3 text-sm font-semibold transition-colors"
            style={{ color: CYPRUS[600] }}
          >
            Read full transcription →
          </button>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-3 bg-gray-50 border-t border-border flex gap-2">
        <motion.button
          className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border-2 border-gray-200 hover:bg-white"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ color: CYPRUS[700] }}
        >
          Download
        </motion.button>
        <motion.button
          className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: CYPRUS[700] }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Analyze
        </motion.button>
      </div>
    </motion.div>
  )
}
