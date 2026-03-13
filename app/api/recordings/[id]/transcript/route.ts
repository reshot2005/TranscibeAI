import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('transcript api env missing')
    return NextResponse.json([], { status: 200 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from('transcript_segments')
    .select('id, speaker, text, start_ms')
    .eq('recording_id', params.id)
    .order('start_ms', { ascending: true })

  if (error) {
    console.error('transcript api supabase error', error)
    // Return empty array so UI doesn't crash; logs will show the real issue.
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(data ?? [], { status: 200 })
}


