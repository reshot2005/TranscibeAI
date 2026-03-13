'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShinyButton } from '@/components/reactbits/ShinyButton'
import { CYPRUS, SAND } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data.error || 'Login failed')
      }

      // Mark admin session in localStorage (credentials themselves are in DB)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('voicevault_admin', email)
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-cyprus-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl border"
          style={{
            backgroundColor: SAND[900],
            borderColor: `${CYPRUS[700]}30`,
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold mb-2" style={{ color: CYPRUS[900] }}>
              VoiceVault
            </h1>
            <p style={{ color: CYPRUS[500] }}>Sign in to your account</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: CYPRUS[700] }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2"
                style={{
                  borderColor: `${CYPRUS[400]}50`,
                  backgroundColor: 'white',
                  color: CYPRUS[900],
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = CYPRUS[400]
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${CYPRUS[400]}50`
                }}
              />
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: CYPRUS[700] }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2"
                style={{
                  borderColor: `${CYPRUS[400]}50`,
                  backgroundColor: 'white',
                  color: CYPRUS[900],
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = CYPRUS[400]
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${CYPRUS[400]}50`
                }}
              />
            </motion.div>

            {/* Remember Me */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center justify-between text-sm"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded w-4 h-4" />
                <span style={{ color: CYPRUS[600] }}>Remember me</span>
              </label>
              <a href="#" style={{ color: CYPRUS[600] }} className="hover:underline">
                Forgot password?
              </a>
            </motion.div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <ShinyButton
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </ShinyButton>
            </motion.div>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-500">
              {error}
            </p>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: `${CYPRUS[400]}30` }} />
            <span style={{ color: CYPRUS[500], fontSize: '0.875rem' }}>Or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: `${CYPRUS[400]}30` }} />
          </div>

          {/* Social Buttons (disabled / placeholder) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            <button
              className="py-2 px-4 rounded-lg border font-medium transition-all hover:bg-opacity-80"
              style={{
                borderColor: `${CYPRUS[400]}50`,
                color: CYPRUS[700],
              }}
            >
              Google
            </button>
            <button
              className="py-2 px-4 rounded-lg border font-medium transition-all hover:bg-opacity-80"
              style={{
                borderColor: `${CYPRUS[400]}50`,
                color: CYPRUS[700],
              }}
            >
              GitHub
            </button>
          </motion.div>

          {/* Sign Up Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center text-sm mt-6"
            style={{ color: CYPRUS[600] }}
          >
            Don't have an account?{' '}
            <a href="#" style={{ color: CYPRUS[700] }} className="font-semibold hover:underline">
              Sign up
            </a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
