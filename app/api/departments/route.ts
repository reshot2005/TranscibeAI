import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { name?: string } | null

  if (!body?.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Supabase env vars missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/departments`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ name: body.name }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error('Create department failed', resp.status, text)

    // Handle duplicate name (unique constraint) as a 409 Conflict, not a 500
    if (resp.status === 409 || text.includes('duplicate key value')) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Create department failed' }, { status: 500 })
  }

  const [row] = await resp.json()
  return NextResponse.json(row, { status: 201 })
}

