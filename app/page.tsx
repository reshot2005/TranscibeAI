'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Hero } from '@/components/sections/Hero'
import { useRouter } from 'next/navigation'
import { ScrollProgressBar } from '@/components/reactbits/ScrollProgressBar'
import { ShinyButton } from '@/components/reactbits/ShinyButton'
import { CYPRUS, SAND } from '@/lib/constants'

export default function Home() {
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const html = document.documentElement
    setIsDark(html.classList.contains('dark'))

    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains('dark'))
    })

    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar color={CYPRUS[700]} height={3} />

      {/* Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-xl font-bold" style={{ color: CYPRUS[700] }}>
            VoiceVault
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20">
        <Hero />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            className="text-4xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Powerful Features
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'AI Transcription', desc: 'Real-time audio to text' },
              { title: 'Smart Analysis', desc: 'Extract insights automatically' },
              { title: 'Secure Storage', desc: 'Enterprise-grade encryption' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="p-8 rounded-lg border border-border bg-background hover:bg-card transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20"
        style={{ backgroundColor: CYPRUS[700], color: SAND[900] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-4xl font-bold mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Ready to Transform Your Audio?
          </motion.h2>
          <motion.p
            className="text-lg mb-8 opacity-90 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Start analyzing your recordings with AI-powered intelligence.
          </motion.p>
          <ShinyButton onClick={() => router.push('/login')}>
            Get Started Free
          </ShinyButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground text-sm">
            <p>© 2024 VoiceVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
