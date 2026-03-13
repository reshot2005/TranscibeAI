import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  const departmentId = form.get('departmentId')
  const memberId = form.get('memberId')
  const folderId = form.get('folderId')
  const title = (form.get('title') as string) || 'Untitled recording'

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 })
  }

  if (!departmentId || !memberId || !folderId) {
    return NextResponse.json(
      { error: 'departmentId, memberId, and folderId are required' },
      { status: 400 },
    )
  }

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

  const recordingId = uuidv4()

  try {
    // 1) Upload original file to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    // Supabase Storage keys must avoid certain characters. Sanitize filename.
    const safeFileName = (file.name || 'audio')
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/gi, '_')
    const path = `uploads/${departmentId}/${memberId}/${recordingId}-${safeFileName}`

    const storageResp = await fetch(
      `${supabaseUrl}/storage/v1/object/recordings-original/${path}`,
      {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: Buffer.from(arrayBuffer),
      },
    )

    if (!storageResp.ok) {
      const text = await storageResp.text()
      console.error('Storage upload failed', storageResp.status, text)
      return NextResponse.json(
        { error: 'Storage upload failed', details: text },
        { status: 500 },
      )
    }

    // 2) Insert recording row
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
        title,
        original_storage_path: path,
        status: 'processing',
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

    // 3) Upload to AssemblyAI
    const uploadResp = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        Authorization: aaiKey,
      },
      body: Buffer.from(arrayBuffer),
    })

    if (!uploadResp.ok) {
      const text = await uploadResp.text()
      console.error('AssemblyAI upload failed', uploadResp.status, text)
      return NextResponse.json(
        { error: 'AssemblyAI upload failed', details: text },
        { status: 500 },
      )
    }

    const uploadJson = await uploadResp.json()
    const audioUrl = uploadJson.upload_url as string

    // 4) Create AssemblyAI transcript job with webhook.
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
        audio_url: audioUrl,
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

