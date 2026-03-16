'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

type DashboardStats = {
  totalRecordings: number
  hoursProcessed: number
  accuracyRate: number
  teamMembers: number
}

type DashboardRecording = {
  id: string
  title: string | null
  created_at: string
  status: string | null
}

type DashboardDepartment = {
  id: string
  name: string
  recording_count: number
}

type StorageUsage = {
  usedBytes: number
  softLimitBytes: number
  hardLimitBytes: number
}

export function useDashboardRealtime() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRecordings, setRecentRecordings] = useState<DashboardRecording[]>([])
  const [departments, setDepartments] = useState<DashboardDepartment[]>([])
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    const load = async () => {
      // Stats – use all recordings for count, and any with duration/accuracy set
      const { data: allRecordings } = await supabase
        .from('recordings')
        .select('id, duration_seconds, estimated_accuracy')

      const { data: members } = await supabase.from('team_members').select('id')

      const all = (allRecordings ?? []) as any[]

      const totalRecordings = all.length
      const hoursProcessed =
        all.reduce(
          (sum, r: any) => sum + (r.duration_seconds ?? 0),
          0,
        ) / 3600

      const withAccuracy = all.filter(
        (r: any) => typeof r.estimated_accuracy === 'number',
      )
      const accuracyRate =
        withAccuracy.length > 0
          ? withAccuracy.reduce(
              (sum, r: any) => sum + (r.estimated_accuracy ?? 0),
              0,
            ) / withAccuracy.length
          : 0

      setStats({
        totalRecordings,
        hoursProcessed: Number(hoursProcessed.toFixed(1)),
        accuracyRate: Number(accuracyRate.toFixed(1)),
        teamMembers: members?.length ?? 0,
      })

      // Recent recordings
      const { data: recs } = await supabase
        .from('recordings')
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentRecordings(
        (recs ?? []).map((r: any) => ({
          id: r.id,
          title: r.title,
          created_at: r.created_at,
          status: r.status,
        })),
      )

      // Departments with recording counts
      const { data: deptRows } = await supabase
        .from('departments')
        .select('id, name, recordings:recordings(id)')

      setDepartments(
        (deptRows ?? []).map((d: any) => ({
          id: d.id,
          name: d.name,
          recording_count: d.recordings?.length ?? 0,
        })),
      )

      // Storage usage
      try {
        const resp = await fetch('/api/storage/usage')
        if (resp.ok) {
          const json = (await resp.json()) as StorageUsage
          setStorageUsage(json)
        }
      } catch (e) {
        console.error('failed to load storage usage', e)
      }
    }

    load()

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recordings' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { stats, recentRecordings, departments, storageUsage }
}

