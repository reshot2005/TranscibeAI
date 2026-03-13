import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

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

  try {
    // 1) Insert recording row (the file is already in Supabase Storage)
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

    // 2) Create AssemblyAI transcript job with webhook, using Supabase public URL directly.
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
        audio_url: publicAudioUrl,
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

