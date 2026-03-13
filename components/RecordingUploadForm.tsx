'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, X } from 'lucide-react'
import { CYPRUS, SAND } from '@/lib/constants'

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
}

interface RecordingUploadFormProps {
  teamMembers: TeamMember[]
  onSubmit: (data: {
    memberId: string
    title: string
    transcription: string
  }) => void
  onCancel: () => void
}

export function RecordingUploadForm({
  teamMembers,
  onSubmit,
  onCancel,
}: RecordingUploadFormProps) {
  const [selectedMember, setSelectedMember] = useState('')
  const [title, setTitle] = useState('')
  const [transcription, setTranscription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!selectedMember) newErrors.member = 'Please select a team member'
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!transcription.trim())
      newErrors.transcription = 'Transcription is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      memberId: selectedMember,
      title,
      transcription,
    })

    // Reset form
    setSelectedMember('')
    setTitle('')
    setTranscription('')
    setErrors({})
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="p-6 bg-gradient-to-br from-white to-gray-50"
    >
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Team Member Selection */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: CYPRUS[700] }}
            >
              Select Team Member
            </label>
            <select
              value={selectedMember}
              onChange={(e) => {
                setSelectedMember(e.target.value)
                setErrors({ ...errors, member: '' })
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors font-medium"
              style={{
                borderColor: errors.member ? '#EF4444' : 'rgb(229, 231, 235)',
                focusBorderColor: CYPRUS[700],
              }}
            >
              <option value="">-- Choose a member --</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.avatar} {member.name}
                </option>
              ))}
            </select>
            {errors.member && (
              <p className="text-red-500 text-sm mt-2">{errors.member}</p>
            )}
          </div>

          {/* Recording Title */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: CYPRUS[700] }}
            >
              Recording Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setErrors({ ...errors, title: '' })
              }}
              placeholder="e.g., Team Meeting, Client Call"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
              style={{
                borderColor: errors.title ? '#EF4444' : 'rgb(229, 231, 235)',
              }}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2">{errors.title}</p>
            )}
          </div>
        </div>

        {/* Right Column - Transcription */}
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: CYPRUS[700] }}
          >
            Transcription
          </label>
          <textarea
            value={transcription}
            onChange={(e) => {
              setTranscription(e.target.value)
              setErrors({ ...errors, transcription: '' })
            }}
            placeholder="Paste the recording transcription here..."
            className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors resize-none"
            style={{
              borderColor: errors.transcription ? '#EF4444' : 'rgb(229, 231, 235)',
            }}
          />
          {errors.transcription && (
            <p className="text-red-500 text-sm mt-2">{errors.transcription}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {transcription.length} characters
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-3 justify-end border-t border-gray-200 pt-6">
        <motion.button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg border-2 border-gray-200 font-semibold hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          className="px-8 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
          style={{ backgroundColor: CYPRUS[700] }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload size={18} />
          Upload Recording
        </motion.button>
      </div>
    </motion.form>
  )
}
