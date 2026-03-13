import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { email?: string; password?: string } | null

  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Supabase env vars missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const url = `${supabaseUrl}/rest/v1/admin_users?select=email,password_hash&email=eq.${encodeURIComponent(
    body.email,
  )}&limit=1`

  const resp = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error('Supabase admin_users fetch failed', resp.status, text)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }

  const rows = (await resp.json()) as Array<{ email: string; password_hash: string }>

  if (!rows.length) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const admin = rows[0]

  if (admin.password_hash !== body.password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Very simple session: client will store a flag; credentials themselves live in DB.
  return NextResponse.json({ ok: true, email: admin.email })
}

