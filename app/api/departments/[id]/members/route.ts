import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const body = (await req.json().catch(() => null)) as { name?: string; role?: string } | null

  if (!body?.name || !body?.role) {
    return NextResponse.json({ error: 'Name and role are required' }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Supabase env vars missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/team_members`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      department_id: id,
      name: body.name,
      role: body.role,
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error('Create team member failed', resp.status, text)
    return NextResponse.json({ error: 'Create member failed' }, { status: 500 })
  }

  const [row] = await resp.json()
  return NextResponse.json(row, { status: 201 })
}


