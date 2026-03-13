'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Plus, Trash2, Music } from 'lucide-react'
import { CYPRUS, SAND } from '@/lib/constants'
import { RecordingUploadForm } from '@/components/RecordingUploadForm'
import { RecordingCard } from '@/components/RecordingCard'

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
}

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

export default function DepartmentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'John Smith', role: 'Department Lead', avatar: '👨‍💼' },
    { id: '2', name: 'Sarah Johnson', role: 'Manager', avatar: '👩‍💼' },
    { id: '3', name: 'Mike Chen', role: 'Specialist', avatar: '👨‍🔧' },
    { id: '4', name: 'Emma Davis', role: 'Coordinator', avatar: '👩‍💻' },
  ])

  const [recordings, setRecordings] = useState<Recording[]>([
    {
      id: '1',
      memberId: '1',
      memberName: 'John Smith',
      title: 'Q4 Planning Meeting',
      duration: '45:30',
      transcription:
        'Discussion about quarterly goals, budget allocation, and team performance metrics...',
      uploadedAt: '2 days ago',
    },
    {
      id: '2',
      memberId: '2',
      memberName: 'Sarah Johnson',
      title: 'Training Session',
      duration: '32:15',
      transcription:
        'Comprehensive training on new company policies and procedures for all staff members...',
      uploadedAt: '5 days ago',
    },
  ])

  const [showUploadForm, setShowUploadForm] = useState(false)

  const handleRecordingUpload = (data: {
    memberId: string
    title: string
    transcription: string
  }) => {
    const newRecording: Recording = {
      id: Date.now().toString(),
      memberId: data.memberId,
      memberName:
        teamMembers.find((m) => m.id === data.memberId)?.name || 'Unknown',
      title: data.title,
      duration: '0:00',
      transcription: data.transcription,
      uploadedAt: 'Just now',
    }
    setRecordings([newRecording, ...recordings])
    setShowUploadForm(false)
  }

  const handleDeleteRecording = (recordingId: string) => {
    setRecordings(recordings.filter((r) => r.id !== recordingId))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: SAND[100] }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-border p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: CYPRUS[700] }}>
              Department Recordings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage team member recordings and transcriptions
            </p>
          </div>
          <motion.button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: CYPRUS[700] }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload size={20} />
            <span>Upload Recording</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Upload Form */}
      {showUploadForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white border-b border-border"
        >
          <RecordingUploadForm
            teamMembers={teamMembers}
            onSubmit={handleRecordingUpload}
            onCancel={() => setShowUploadForm(false)}
          />
        </motion.div>
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Team Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: CYPRUS[700] }}>
            Team Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-lg p-4 border-2 border-border hover:border-cyan-400 transition-colors"
              >
                <div className="text-5xl mb-3">{member.avatar}</div>
                <h3 className="font-bold text-lg" style={{ color: CYPRUS[700] }}>
                  {member.name}
                </h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
                <div
                  className="mt-4 pt-4 border-t border-border text-xs font-semibold"
                  style={{ color: CYPRUS[600] }}
                >
                  {recordings.filter((r) => r.memberId === member.id).length}{' '}
                  recordings
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recordings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: CYPRUS[700] }}>
              Recent Recordings
            </h2>
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: CYPRUS[100],
                color: CYPRUS[700],
              }}
            >
              {recordings.length} total
            </span>
          </div>

          {recordings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recordings.map((recording, idx) => (
                <motion.div
                  key={recording.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <RecordingCard
                    recording={recording}
                    onDelete={() => handleDeleteRecording(recording.id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-border"
            >
              <Music size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold text-muted-foreground">
                No recordings yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first recording to get started
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
