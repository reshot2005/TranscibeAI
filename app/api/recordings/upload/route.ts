import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

const SOFT_LIMIT_BYTES = 900 * 1024 * 1024
const HARD_LIMIT_BYTES = 1024 * 1024 * 1024

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const cloudApiKey = process.env.CLOUDINARY_API_KEY
const cloudApiSecret = process.env.CLOUDINARY_API_SECRET

if (cloudName && cloudApiKey && cloudApiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: cloudApiKey,
    api_secret: cloudApiSecret,
  })
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | {
        recordingId?: string
        departmentId?: string
        memberId?: string
        folderId?: string | null
        title?: string
        storagePath?: string
        publicAudioUrl?: string
      }
    | null

  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { recordingId, departmentId, memberId, folderId, title, storagePath, publicAudioUrl } = body

  if (!recordingId || !departmentId || !memberId || !folderId || !storagePath || !publicAudioUrl) {
    return NextResponse.json(
      {
        error:
          'recordingId, departmentId, memberId, folderId, storagePath, and publicAudioUrl are required',
      },
      { status: 400 },
    )
  }

  const finalTitle = title || 'Untitled recording'

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const aaiKey = process.env.ASSEMBLYAI_API_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceKey || !aaiKey || !anonKey) {
    console.error('upload route env error', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      hasAssemblyKey: !!aaiKey,
      hasAnonKey: !!anonKey,
    })
    return NextResponse.json(
      {
        error:
          'Server misconfigured: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ASSEMBLYAI_API_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY',
      },
      { status: 500 },
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  try {
    // 1) Determine current Supabase usage in bytes (only recordings stored in Supabase)
    let supabaseUsageBytes = 0
    const { data: rows, error: usageError } = await supabase
      .from('recordings')
      .select('storage_bytes, storage_type')
      .eq('storage_type', 'supabase')

    if (!usageError && rows) {
      supabaseUsageBytes = rows.reduce((sum: number, r: any) => {
        const v = typeof r.storage_bytes === 'number' ? r.storage_bytes : Number(r.storage_bytes ?? 0)
        return sum + (Number.isFinite(v) ? v : 0)
      }, 0)
    } else if (usageError) {
      console.error('failed to compute Supabase usage', usageError)
    }

    // 2) Get size of the newly uploaded file from Supabase Storage
    let fileSizeBytes = 0
    const { data: info, error: infoError } = await supabase.storage
      .from('recordings-original')
      .info(storagePath)
    if (!infoError && info && typeof (info as any).size === 'number') {
      fileSizeBytes = (info as any).size as number
    } else if (infoError) {
      console.error('failed to read storage object info', infoError)
    }

    const willFitInSupabase = supabaseUsageBytes + fileSizeBytes < SOFT_LIMIT_BYTES

    let storageType: 'supabase' | 'cloudinary' = 'supabase'
    let storageBytes = fileSizeBytes
    let finalAudioUrl = publicAudioUrl

    // 3) If we're above the soft limit and Cloudinary is configured, overflow to Cloudinary.
    if (!willFitInSupabase) {
      if (!cloudName || !cloudApiKey || !cloudApiSecret) {
        console.warn(
          'Cloudinary not configured; falling back to Supabase storage even though soft limit exceeded',
        )
      } else {
        try {
          const uploadResult = await cloudinary.uploader.upload(publicAudioUrl, {
            folder: 'voicevault',
            resource_type: 'video',
          })
          finalAudioUrl = uploadResult.secure_url
          storageType = 'cloudinary'
          storageBytes = uploadResult.bytes ?? fileSizeBytes

          // Best-effort: remove original object from Supabase to free space
          const { error: removeError } = await supabase.storage
            .from('recordings-original')
            .remove([storagePath])
          if (removeError) {
            console.error('failed to remove Supabase object after Cloudinary upload', removeError)
          }
        } catch (cloudErr) {
          console.error('Cloudinary upload failed, keeping file in Supabase instead', cloudErr)
          // Fall back to Supabase-backed storage; finalAudioUrl remains publicAudioUrl
          storageType = 'supabase'
        }
      }
    }

    // 4) Insert recording row
    const insertResp = await fetch(`${supabaseUrl}/rest/v1/recordings`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id: recordingId,
        team_id: departmentId,
        user_id: memberId,
        department_id: departmentId,
        team_member_id: memberId,
        folder_id: folderId,
        title: finalTitle,
        original_storage_path: storagePath,
        status: 'processing',
        audio_url: finalAudioUrl,
        storage_type: storageType,
        storage_bytes: storageBytes || null,
      }),
    })

    if (!insertResp.ok) {
      const text = await insertResp.text()
      console.error('Insert recording failed', insertResp.status, text)
      return NextResponse.json(
        { error: 'Insert recording failed', details: text },
        { status: 500 },
      )
    }

    // 5) Create AssemblyAI transcript job with webhook, using the final audio URL.
    // Supabase Edge Functions require an apikey query param for unauthenticated calls.
    const webhookUrl =
      `${supabaseUrl}/functions/v1/webhook-assemblyai` +
      `?recording_id=${recordingId}&apikey=${anonKey}`

    const transcriptResp = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        Authorization: aaiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: finalAudioUrl,
        speech_models: ['universal-2'],
        speaker_labels: true,
        sentiment_analysis: true,
        punctuate: true,
        format_text: true,
        webhook_url: webhookUrl,
      }),
    })

    if (!transcriptResp.ok) {
      const text = await transcriptResp.text()
      console.error('AssemblyAI transcript create failed', transcriptResp.status, text)
      return NextResponse.json(
        { error: 'AssemblyAI transcript create failed', details: text },
        { status: 500 },
      )
    }

    const transcriptJson = await transcriptResp.json()
    const transcriptId = transcriptJson.id as string | undefined

    // Try to save AssemblyAI transcript id on the recording (for later retrieval).
    if (transcriptId) {
      const patchResp = await fetch(
        `${supabaseUrl}/rest/v1/recordings?id=eq.${encodeURIComponent(recordingId)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ aai_transcript_id: transcriptId }),
        },
      )
      if (!patchResp.ok) {
        const text = await patchResp.text()
        console.error('Patch recording aai_transcript_id failed', patchResp.status, text)
      }
    }

    return NextResponse.json({ ok: true, recordingId }, { status: 200 })
  } catch (err) {
    console.error('upload route fatal error', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 },
    )
  }
}

