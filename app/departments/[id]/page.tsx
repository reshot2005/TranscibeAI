'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { MemberRecordingPanel } from '@/components/MemberRecordingPanel'

type TeamMember = {
  id: string
  name: string
  role: string
}

export default function DepartmentPage() {
  const params = useParams<{ id: string }>()
  const departmentId = params.id

  const [members, setMembers] = useState<TeamMember[]>([])
  const [deptName, setDeptName] = useState<string>('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    const load = async () => {
      const [{ data: dept }, { data: mems }] = await Promise.all([
        supabase.from('departments').select('name').eq('id', departmentId).single(),
        supabase
          .from('team_members')
          .select('id, name, role')
          .eq('department_id', departmentId)
          .order('created_at', { ascending: true }),
      ])

      setDeptName(dept?.name ?? '')
      setMembers((mems ?? []) as TeamMember[])
    }

    load()

    const channel = supabase
      .channel(`dept-${departmentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members', filter: `department_id=eq.${departmentId}` },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [departmentId])

  const addMember = async () => {
    if (!name || !role) return
    await fetch(`/api/departments/${departmentId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role }),
    })
    setName('')
    setRole('')
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{deptName || 'Department'}</h1>
            <p className="text-sm text-muted-foreground">
              Manage your team and their recordings in real time.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <h2 className="font-medium mb-3 text-sm">Add team member</h2>
              <div className="space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Role"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
                <button
                  onClick={addMember}
                  className="w-full mt-1 rounded bg-emerald-600 text-white text-sm py-2"
                >
                  Add Member
                </button>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="font-medium mb-3 text-sm">Team members</h2>
              <div className="space-y-1">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className={`w-full text-left px-3 py-2 rounded text-sm border ${
                      selectedMember?.id === m.id
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.role}</div>
                  </button>
                ))}
                {members.length === 0 && (
                  <p className="text-xs text-slate-500">No members yet. Add one above.</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            {selectedMember ? (
              <MemberRecordingPanel
                departmentId={departmentId}
                memberId={selectedMember.id}
                memberName={selectedMember.name}
              />
            ) : (
              <div className="rounded-lg border bg-white p-6 text-sm text-slate-500">
                Select a team member on the left to upload recordings and view their sessions.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

