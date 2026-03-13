'use client'

import { ReactNode } from 'react'

interface AuroraBackgroundProps {
  children: ReactNode
  className?: string
}

export function AuroraBackground({
  children,
  className = '',
}: AuroraBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Aurora gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#004643] via-[#00796B] to-[#002E2C]" />

      {/* Animated aurora lines */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-[#00796B] rounded-full filter blur-3xl opacity-20 animate-pulse"
          style={{
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#004643] rounded-full filter blur-3xl opacity-15"
          style={{
            animation: 'float 6s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#005A51] rounded-full filter blur-3xl opacity-20"
          style={{
            animation: 'float 10s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </div>
  )
}
