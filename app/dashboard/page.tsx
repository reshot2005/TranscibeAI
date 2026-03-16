'use client'

import { motion } from 'framer-motion'
import { EnhancedSidebar } from '@/components/EnhancedSidebar'
import { ShinyButton } from '@/components/reactbits/ShinyButton'
import { NumberTickerWrapper } from '@/components/reactbits/NumberTickerWrapper'
import { BlurInHeading } from '@/components/reactbits/BlurInHeading'
import { CYPRUS, SAND } from '@/lib/constants'
import { LiveTranscript } from '@/components/live-transcript'
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime'

export default function DashboardPage() {
  const { stats, recentRecordings, storageUsage } = useDashboardRealtime()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: SAND[900] }}>
      {/* Enhanced Sidebar */}
      <EnhancedSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold mb-2" style={{ color: CYPRUS[900] }}>
              VoiceVault Dashboard
            </h1>
            <p style={{ color: CYPRUS[500] }}>
              Here's what's happening in your recordings today.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {[
              { key: 'totalRecordings', label: 'Total Recordings', icon: '🎙️', value: stats?.totalRecordings ?? 0 },
              { key: 'hoursProcessed', label: 'Hours Processed', icon: '⏱️', value: stats?.hoursProcessed ?? 0 },
              { key: 'accuracyRate', label: 'Accuracy Rate', icon: '✅', value: stats?.accuracyRate ?? 0, isPercent: true },
              { key: 'teamMembers', label: 'Team Members', icon: '👥', value: stats?.teamMembers ?? 0 },
            ].map((stat, idx) => (
              <motion.div
                key={stat.key}
                variants={itemVariants}
                className="rounded-xl p-6 border transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'white',
                  borderColor: `${CYPRUS[400]}30`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p
                      style={{ color: CYPRUS[500], fontSize: '0.875rem' }}
                      className="font-medium"
                    >
                      {stat.label}
                    </p>
                  </div>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold" style={{ color: CYPRUS[900] }}>
                  {stat.isPercent ? (
                    `${stat.value}%`
                  ) : (
                    <NumberTickerWrapper value={stat.value} decimals={0} />
                  )}
                </div>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: `${CYPRUS[400]}20` }}>
                  <p style={{ color: CYPRUS[400], fontSize: '0.875rem' }}>
                    ↑ 12% from last month
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Supabase Storage Usage */}
          <div className="mb-10">
            <h3 className="text-sm font-semibold mb-2" style={{ color: CYPRUS[900] }}>
              Supabase Storage
            </h3>
            <div className="rounded-lg border px-4 py-3 bg-white" style={{ borderColor: `${CYPRUS[400]}20` }}>
              {storageUsage ? (
                <>
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span style={{ color: CYPRUS[700] }}>
                      {formatMegabytes(storageUsage.usedBytes)} / {formatMegabytes(storageUsage.hardLimitBytes)} used
                    </span>
                    <span style={{ color: CYPRUS[500] }}>
                      Soft limit at {formatMegabytes(storageUsage.softLimitBytes)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (storageUsage.usedBytes / storageUsage.hardLimitBytes) * 100 || 0,
                        )}%`,
                        backgroundColor: CYPRUS[500],
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs" style={{ color: CYPRUS[500] }}>
                  Loading storage usage…
                </p>
              )}
            </div>
          </div>

          {/* Recent Recordings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <BlurInHeading>
              <h2 className="text-2xl font-bold mb-6" style={{ color: CYPRUS[900] }}>
                Recent Recordings
              </h2>
            </BlurInHeading>

            <div className="grid gap-4 mb-8">
              {recentRecordings.map((recording, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05, duration: 0.3 }}
                  className="rounded-lg p-4 border flex items-center justify-between hover:shadow-md transition-all"
                  style={{
                    backgroundColor: 'white',
                    borderColor: `${CYPRUS[400]}20`,
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${CYPRUS[400]}20` }}
                    >
                      🎙️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold" style={{ color: CYPRUS[900] }}>
                        {recording.title || 'Untitled recording'}
                      </p>
                      <p style={{ color: CYPRUS[500], fontSize: '0.875rem' }}>
                        {new Date(recording.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          recording.status === 'processed'
                            ? `${CYPRUS[400]}20`
                            : `#FFA50020`,
                        color:
                          recording.status === 'processed'
                            ? CYPRUS[700]
                            : '#FFA500',
                      }}
                    >
                      {recording.status}
                    </span>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        backgroundColor: `${CYPRUS[400]}10`,
                        color: CYPRUS[700],
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${CYPRUS[400]}20`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${CYPRUS[400]}10`
                      }}
                    >
                      View
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="rounded-xl p-8 border mb-10"
            style={{
              backgroundColor: 'white',
              borderColor: `${CYPRUS[400]}20`,
            }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: CYPRUS[900] }}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ShinyButton onClick={() => {}}>Upload Recording</ShinyButton>
              <ShinyButton onClick={() => {}}>View Analytics</ShinyButton>
              <ShinyButton onClick={() => {}}>Export Data</ShinyButton>
            </div>
          </motion.div>

          {/* Live Transcription Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <BlurInHeading>
              <h2 className="text-2xl font-bold mb-4" style={{ color: CYPRUS[900] }}>
                Live Transcription
              </h2>
            </BlurInHeading>
            <div className="rounded-xl border bg-white" style={{ borderColor: `${CYPRUS[400]}20` }}>
              <LiveTranscript />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

function formatMegabytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}


