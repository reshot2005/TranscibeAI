'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AuroraBackground } from '@/components/reactbits/AuroraBackground'
import { ParticlesWrapper } from '@/components/reactbits/ParticlesWrapper'
import { TrueFocusText } from '@/components/reactbits/TrueFocusText'
import { MorphingTextWrapper } from '@/components/reactbits/MorphingTextWrapper'
import { TextRevealWrapper } from '@/components/reactbits/TextRevealWrapper'
import { ShinyButton } from '@/components/reactbits/ShinyButton'
import { BorderBeamWrapper } from '@/components/reactbits/BorderBeamWrapper'
import { TypingAnimationWrapper } from '@/components/reactbits/TypingAnimationWrapper'
import { CYPRUS, SAND } from '@/lib/constants'

export function Hero() {
  const router = useRouter()
  const transcriptExamples = [
    "Detected noise distortion at 2:34",
    "Speaker transition identified",
    "Key topic: Q4 product roadmap",
    "Action item: Follow-up email due Friday",
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <AuroraBackground className="absolute inset-0">
        <ParticlesWrapper count={30} particleColor={CYPRUS[400]} />
      </AuroraBackground>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.15, delayChildren: 0.1 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-block mb-6 px-4 py-2 rounded-full border"
            style={{
              borderColor: SAND[300],
              backgroundColor: `${SAND[100]}40`,
              color: CYPRUS[700],
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            ✨ Introducing VoiceVault AI
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ color: SAND[900] }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <TrueFocusText
              className="block"
              color={SAND[900]}
            >
              Intelligent Audio
            </TrueFocusText>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span>for</span>
              <MorphingTextWrapper
                words={['Recordings', 'Conversations', 'Insights']}
                color={CYPRUS[700]}
                duration={4}
              />
            </div>
          </motion.h1>

          {/* Subtitle with TextReveal */}
          <motion.div
            className="mb-8 text-lg sm:text-xl max-w-3xl mx-auto"
            style={{ color: `${CYPRUS[700]}CC` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <TextRevealWrapper
              color={CYPRUS[700]}
              duration={0.08}
            >
              Transform audio into actionable intelligence with AI-powered transcription, speaker detection, and real-time insights.
            </TextRevealWrapper>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <ShinyButton
              bgColor={CYPRUS[700]}
              textColor={SAND[900]}
              className="px-8 py-4 text-lg"
              onClick={() => router.push('/login')}
            >
              Start Free Trial
            </ShinyButton>
            <ShinyButton
              bgColor="transparent"
              textColor={SAND[900]}
              className="px-8 py-4 text-lg border-2"
              style={{ borderColor: SAND[300] }}
              onClick={() => router.push('/login')}
            >
              Watch Demo
            </ShinyButton>
          </motion.div>

          {/* Product Mockup Card with BorderBeam */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <BorderBeamWrapper
              borderColor={SAND[900]}
              className="bg-gradient-to-br from-[#002E2C] to-[#001F1D] p-6 sm:p-8"
            >
              {/* Mockup Content */}
              <div className="space-y-6">
                {/* BLOCKER DETECTED Badge */}
                <motion.div
                  className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: CYPRUS[700],
                    color: SAND[900],
                  }}
                  animate={{ rotate: [0, 1, -1, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🔔 BLOCKER DETECTED
                </motion.div>

                {/* Speaker Timeline Bars */}
                <div className="space-y-4">
                  {[1, 2, 3].map((speaker, idx) => (
                    <div key={speaker} className="space-y-2">
                      <div
                        className="text-sm font-semibold"
                        style={{ color: SAND[900] }}
                      >
                        Speaker {speaker}
                      </div>
                      <motion.div
                        className="flex gap-1 h-8 items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.2 }}
                      >
                        {Array.from({ length: 16 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 rounded"
                            style={{
                              background: CYPRUS[idx * 2],
                            }}
                            animate={{ height: ['100%', '40%', '100%'] }}
                            transition={{
                              duration: 0.5,
                              delay: i * 0.05,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </motion.div>
                    </div>
                  ))}
                </div>

                {/* Live Typing Animation */}
                <div className="pt-4 border-t" style={{ borderColor: `${CYPRUS[700]}40` }}>
                  <div
                    className="text-sm mb-2"
                    style={{ color: `${SAND[900]}80` }}
                  >
                    Live Transcription
                  </div>
                  <TypingAnimationWrapper
                    text={transcriptExamples[Math.floor(Math.random() * transcriptExamples.length)]}
                    color={SAND[900]}
                    speed={50}
                  />
                </div>
              </div>
            </BorderBeamWrapper>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
