import { NextRequest, NextResponse } from 'next/server'

// Delete a single recording (and let Supabase cascades remove related rows)
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('delete recording env missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const resp = await fetch(
    `${supabaseUrl}/rest/v1/recordings?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  )

  if (!resp.ok) {
    const text = await resp.text()
    console.error('Delete recording failed', resp.status, text)
    return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

