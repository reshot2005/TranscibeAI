'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type FullRecording = {
  title: string
  transcriptText: string
  summary?: string
  error?: string
}

export default function RecordingPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<FullRecording | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`/api/recordings/${params.id}/full`)
        const json = (await resp.json()) as FullRecording
        setData(json)
      } catch (e: any) {
        setData({ title: 'Recording', transcriptText: '', error: e.message })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) {
    return <div className="p-8 text-sm">Loading transcript…</div>
  }

  if (!data || (data as any).error) {
    return (
      <div className="p-8 text-sm text-red-500">
        {(data as any)?.error ?? 'Failed to load transcript.'}
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold mb-2">{data.title}</h1>
      </header>

      {data.summary && (
        <section className="rounded-lg border bg-emerald-50 p-4 text-sm space-y-2">
          <h2 className="font-semibold text-emerald-900">AI Summary</h2>
          <p className="text-emerald-900 whitespace-pre-wrap">{data.summary}</p>
        </section>
      )}

      <section className="rounded-lg border bg-white p-4 text-sm max-h-[70vh] overflow-y-auto">
        <pre className="whitespace-pre-wrap font-sans text-sm">
          {data.transcriptText || 'No transcript text available.'}
        </pre>
      </section>
    </main>
  )
}

