import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  const body = (await req.json().catch(() => null)) as { name?: string } | null
  if (!body?.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('folders api env missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/recording_folders`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      team_member_id: id,
      name: body.name,
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error('Create recording folder failed', resp.status, text)
    return NextResponse.json({ error: 'Create folder failed' }, { status: 500 })
  }

  const [row] = await resp.json()
  return NextResponse.json(row, { status: 201 })
}

