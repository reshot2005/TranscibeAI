import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  try {
    // 1. Fetch recordings to delete storage files
    const recResp = await fetch(`${supabaseUrl}/rest/v1/recordings?team_member_id=eq.${encodeURIComponent(id)}&select=original_storage_path,storage_type`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    })
    
    if (recResp.ok) {
      const recordings = await recResp.json()
      const supabasePaths = recordings
        .filter((r: any) => r.storage_type === 'supabase' && r.original_storage_path)
        .map((r: any) => r.original_storage_path)

      if (supabasePaths.length > 0) {
        const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false }})
        await supabase.storage.from('recordings-original').remove(supabasePaths)
      }
    }
  } catch (e) {
    console.error('Failed to cleanup storage', e)
  }

  // 2. Delete the member
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/team_members?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  )

  if (!resp.ok) {
    return NextResponse.json({ error: 'Delete member failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const body = (await req.json().catch(() => null)) as
    | {
        name?: string
        role?: string
      }
    | null

  if (!body || (!body.name && !body.role)) {
    return NextResponse.json(
      { error: 'Nothing to update. Provide name and/or role.' },
      { status: 400 },
    )
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('team-members route env error', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
    })
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const update: Record<string, unknown> = {}
  if (body.name) update.name = body.name
  if (body.role) update.role = body.role

  const resp = await fetch(
    `${supabaseUrl}/rest/v1/team_members?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(update),
    },
  )

  if (!resp.ok) {
    const text = await resp.text()
    console.error('Update team member failed', resp.status, text)
    return NextResponse.json({ error: 'Update member failed' }, { status: 500 })
  }

  const [row] = await resp.json()
  return NextResponse.json(row, { status: 200 })
}

