'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import Link from 'next/link'

type Props = {
  departmentId: string
  memberId: string
  memberName: string
}

type RecordingRow = {
  id: string
  title: string | null
  status: string | null
  original_storage_path: string
  audio_url?: string | null
  created_at?: string
  duration_seconds?: number | null
  folder_id?: string | null
}

type TranscriptLine = {
  id: number
  speaker: string
  text: string
}

export function MemberRecordingPanel({ departmentId, memberId, memberName }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState<string>('')
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [recordings, setRecordings] = useState<RecordingRow[]>([])
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [newFolderName, setNewFolderName] = useState<string>('')
  const [daySortAsc, setDaySortAsc] = useState(true)
  const [search, setSearch] = useState('')
  const [openTranscriptId, setOpenTranscriptId] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptLine[]>>({})

  const supabase = getSupabaseBrowser()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('recordings')
        .select('id, title, status, original_storage_path, audio_url, created_at, duration_seconds, folder_id')
        .eq('department_id', departmentId)
        .eq('team_member_id', memberId)
        .order('created_at', { ascending: false })

      setRecordings((data ?? []) as any)

      const { data: folderRows } = await supabase
        .from('recording_folders')
        .select('id, name')
        .eq('team_member_id', memberId)
        .order('created_at', { ascending: true })

      setFolders((folderRows ?? []) as any)
      if (!selectedFolderId && folderRows && folderRows.length > 0) {
        setSelectedFolderId(folderRows[0].id)
      }
    }

    load()

    const channel = supabase
      .channel(`member-recordings-${memberId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recordings', filter: `team_member_id=eq.${memberId}` },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [departmentId, memberId, supabase, selectedFolderId])

  useEffect(() => {
    const channel = supabase
      .channel(`member-recording-folders-${memberId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recording_folders', filter: `team_member_id=eq.${memberId}` },
        async () => {
          const { data } = await supabase
            .from('recording_folders')
            .select('id, name')
            .eq('team_member_id', memberId)
            .order('created_at', { ascending: true })
          setFolders((data ?? []) as any)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId, supabase])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    if (!selectedFolderId) {
      setUploadStatus('Please select or create a folder before uploading.')
      return
    }
    setIsUploading(true)
    setUploadStatus(`Uploading ${files.length} recording(s)...`)

    try {
      let successCount = 0
      let failureCount = 0

      for (const file of files) {
        try {
          // 1) Upload file directly from browser to Supabase Storage
          const recordingId = crypto.randomUUID()
          const safeFileName = (file.name || 'audio')
            .toLowerCase()
            .replace(/[^a-z0-9.\-_]+/gi, '_')
          const storagePath = `uploads/${departmentId}/${memberId}/${recordingId}-${safeFileName}`

          const { error: storageError } = await supabase.storage
            .from('recordings-original')
            .upload(storagePath, file)

          if (storageError) {
            console.error('browser storage upload error', storageError)
            throw new Error('Failed to upload file to storage')
          }

          const { data: pub } = supabase.storage
            .from('recordings-original')
            .getPublicUrl(storagePath)

          const publicAudioUrl = pub?.publicUrl
          if (!publicAudioUrl) {
            throw new Error('Failed to get public URL for uploaded file')
          }

          // 2) Call backend with only metadata (small JSON)
          const resp = await fetch('/api/recordings/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordingId,
              departmentId,
              memberId,
              folderId: selectedFolderId,
              title: title || file.name,
              storagePath,
              publicAudioUrl,
            }),
          })

          if (!resp.ok) {
            const data = await resp.json().catch(() => ({}))
            throw new Error(data.error || 'Upload failed')
          }

          successCount += 1
        } catch (err) {
          console.error('single file upload failed', err)
          failureCount += 1
        }
      }

      if (failureCount === 0) {
        setUploadStatus(
          `All ${successCount} recording(s) uploaded. Transcription started – they will appear in the list below.`,
        )
      } else if (successCount === 0) {
        setUploadStatus('All uploads failed. Please check the console logs for details.')
      } else {
        setUploadStatus(
          `${successCount} recording(s) uploaded, ${failureCount} failed. Check console logs for details.`,
        )
      }

      setFiles([])
      setTitle('')
    } catch (err: any) {
      setUploadStatus(err.message ?? 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const createFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    try {
      const resp = await fetch(`/api/team-members/${memberId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        console.error('createFolder error', data)
        setUploadStatus(data.error || 'Failed to create folder')
        return
      }

      const folder = (await resp.json()) as { id: string; name: string }
      setSelectedFolderId(folder.id)
      setNewFolderName('')
    } catch (e: any) {
      console.error('createFolder exception', e)
      setUploadStatus('Failed to create folder')
    }
  }

  const loadTranscript = async (recordingId: string) => {
    if (transcripts[recordingId]) {
      setOpenTranscriptId(openTranscriptId === recordingId ? null : recordingId)
      return
    }

    const resp = await fetch(`/api/recordings/${recordingId}/transcript`)
    if (!resp.ok) {
      console.error('loadTranscript http error', resp.status)
      return
    }
    const data = await resp.json()

    const lines = (data ?? []).map((r: any) => ({
      id: r.id,
      speaker: r.speaker,
      text: r.text,
    }))

    setTranscripts((prev) => ({ ...prev, [recordingId]: lines }))
    setOpenTranscriptId(recordingId)
  }

  const deleteRecording = async (recordingId: string) => {
    try {
      const resp = await fetch(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        setUploadStatus(data.error || 'Failed to delete recording')
        return
      }
      // Supabase Realtime will refresh the list; we just show feedback.
      setUploadStatus('Recording deleted.')
    } catch (e: any) {
      setUploadStatus(e.message ?? 'Failed to delete recording')
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Recordings for {memberName}</h2>
        <p className="text-sm text-slate-500 mb-4">
          Upload an audio file for this team member. It will be sent to AssemblyAI and appear in the
          list below when processed.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-xs"
            >
              <option value="">Select folder…</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="New folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={createFolder}
              className="px-2 py-1 border rounded text-xs text-emerald-700"
            >
              Add folder
            </button>
          </div>
          <input
            type="text"
            placeholder="Recording title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full text-sm border rounded px-3 py-2"
          />
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm"
          />
          <button
            type="submit"
            disabled={files.length === 0 || isUploading}
            className="px-4 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload & Transcribe'}
          </button>
        </form>

        {uploadStatus && <p className="mt-2 text-xs text-slate-600">{uploadStatus}</p>}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Recent recordings</h3>
        {recordings.length === 0 && (
          <p className="text-xs text-slate-500">No recordings yet. Upload one above.</p>
        )}

        {/* Controls: search + sort */}
        {recordings.length > 0 && (
          <div className="flex items-center gap-3 mb-3 text-xs">
            <input
              type="text"
              placeholder="Search folders, titles, or file names…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border rounded px-2 py-1"
            />
            <button
              type="button"
              onClick={() => setDaySortAsc((v) => !v)}
              className="px-2 py-1 border rounded text-emerald-700"
            >
              {daySortAsc ? 'Newest first' : 'Oldest first'}
            </button>
          </div>
        )}

        <FolderGroupedRecordings
          recordings={recordings}
          folders={folders}
          supabaseUrl={supabaseUrl}
          search={search}
          sortAsc={daySortAsc}
          onDelete={deleteRecording}
        />
      </div>
    </div>
  )
}

type GroupProps = {
  recordings: RecordingRow[]
  folders: { id: string; name: string }[]
  supabaseUrl: string
  search: string
  sortAsc: boolean
  onDelete: (id: string) => void
}

function FolderGroupedRecordings({
  recordings,
  folders,
  supabaseUrl,
  search,
  sortAsc,
  onDelete,
}: GroupProps) {
  if (recordings.length === 0) return null

  // Map folders by id
  const folderMap = new Map<string, { id: string; name: string }>()
  for (const f of folders) folderMap.set(f.id, f)

  // Group recordings by folder_id (unknown -> "Unfiled")
  const groups = new Map<
    string,
    { folderId: string | null; name: string; recs: RecordingRow[] }
  >()

  for (const r of recordings) {
    const fid = (r.folder_id as string | null) ?? null
    const folder = fid ? folderMap.get(fid) : null
    const key = fid ?? 'unfiled'
    const name = folder?.name ?? 'Unfiled'
    const existing = groups.get(key)
    if (existing) {
      existing.recs.push(r)
    } else {
      groups.set(key, { folderId: fid, name, recs: [r] })
    }
  }

  const searchLower = search.trim().toLowerCase()

  let items = Array.from(groups.values()).map((g, idx) => {
    const inFolderName = g.name.toLowerCase().includes(searchLower)
    
    // When searching, if folder name matches, keep all recordings.
    // Otherwise, filter recordings inside each folder by title/path.
    const recsForGroup = !searchLower || inFolderName
      ? g.recs
      : g.recs.filter((r) => {
          const title = (r.title || 'untitled recording').toLowerCase()
          const path = (r.original_storage_path || '').toLowerCase()
          return title.includes(searchLower) || path.includes(searchLower)
        })

    const totalSeconds = recsForGroup.reduce(
      (sum, r) => sum + (r.duration_seconds ?? 0),
      0,
    )

    return {
      orderIndex: idx,
      folderId: g.folderId,
      name: g.name,
      recs: recsForGroup,
      totalSeconds,
      inFolderName,
    }
  })

  if (searchLower) {
    items = items.filter((g) => {
      return g.inFolderName || g.recs.length > 0
    })
  }

  items.sort((a, b) =>
    sortAsc ? a.orderIndex - b.orderIndex : b.orderIndex - a.orderIndex,
  )

  if (items.length === 0) {
    return <p className="text-xs text-slate-500">No folders match your search.</p>
  }

  const handleRenameFolder = async (folderId: string | null, currentName: string) => {
    if (!folderId) return
    const nextName = window.prompt('Edit folder name', currentName)?.trim()
    if (!nextName || nextName === currentName) return
    try {
      const resp = await fetch(`/api/recording-folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nextName }),
      })
      if (!resp.ok) {
        console.error('rename folder error', await resp.text())
      }
    } catch (e) {
      console.error('rename folder exception', e)
    }
  }

  return (
    <div className="space-y-3">
      {items.map((group) => (
        <details
          key={group.folderId ?? `unfiled-${group.orderIndex}`}
          className="border rounded-lg bg-slate-50"
          open={group.orderIndex === items[0].orderIndex}
        >
          <summary className="cursor-pointer px-3 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold mr-1">{group.name}</span>
              {group.folderId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRenameFolder(group.folderId, group.name)
                  }}
                  className="text-[11px] text-slate-500 hover:text-emerald-700"
                  aria-label="Edit folder name"
                >
                  ✏️
                </button>
              )}
            </div>
            <div className="text-slate-500 flex items-center gap-3">
              <span>{group.recs.length} recording{group.recs.length !== 1 ? 's' : ''}</span>
              <span>{formatDuration(group.totalSeconds)}</span>
            </div>
          </summary>

          <div className="px-3 pb-3 pt-1 space-y-2">
            {group.recs.map((r) => {
              const audioUrl =
                r.audio_url || `${supabaseUrl}/storage/v1/object/public/recordings-original/${r.original_storage_path}`
              return (
                <div
                  key={r.id}
                  className="border rounded-lg px-3 py-2 flex flex-col gap-2 bg-white"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.title || 'Untitled recording'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Status: {r.status ?? 'unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <audio controls src={audioUrl} className="w-32" />
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        className="text-[10px] px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <Link
                    href={`/recordings/${r.id}`}
                    className="mt-1 text-xs text-emerald-700 hover:underline"
                  >
                    View full transcript & summary
                  </Link>
                </div>
              )
            })}
          </div>
        </details>
      ))}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s'
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}


