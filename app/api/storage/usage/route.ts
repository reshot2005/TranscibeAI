import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SOFT_LIMIT_BYTES = 900 * 1024 * 1024
const HARD_LIMIT_BYTES = 1024 * 1024 * 1024

export async function GET(_req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('storage usage env error', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
    })
    return NextResponse.json(
      { usedBytes: 0, softLimitBytes: SOFT_LIMIT_BYTES, hardLimitBytes: HARD_LIMIT_BYTES },
      { status: 200 },
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  try {
    const { data, error } = await supabase
      .from('recordings')
      .select('storage_bytes, storage_type')
      .eq('storage_type', 'supabase')

    let usedBytes = 0
    if (!error && data) {
      usedBytes = data.reduce((sum: number, r: any) => {
        const v = typeof r.storage_bytes === 'number' ? r.storage_bytes : Number(r.storage_bytes ?? 0)
        return sum + (Number.isFinite(v) ? v : 0)
      }, 0)
    } else if (error) {
      console.error('storage usage query error', error)
    }

    return NextResponse.json(
      { usedBytes, softLimitBytes: SOFT_LIMIT_BYTES, hardLimitBytes: HARD_LIMIT_BYTES },
      { status: 200 },
    )
  } catch (err) {
    console.error('storage usage fatal error', err)
    return NextResponse.json(
      { usedBytes: 0, softLimitBytes: SOFT_LIMIT_BYTES, hardLimitBytes: HARD_LIMIT_BYTES },
      { status: 200 },
    )
  }
}

