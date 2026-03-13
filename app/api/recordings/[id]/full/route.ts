import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const aaiKey = process.env.ASSEMBLYAI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  if (!supabaseUrl || !serviceKey || !aaiKey) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 200 },
    )
  }

  // 1) Load recording to get title and AssemblyAI transcript id
  const recResp = await fetch(
    `${supabaseUrl}/rest/v1/recordings?id=eq.${encodeURIComponent(
      id,
    )}&select=title,aai_transcript_id&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/json',
      },
    },
  )

  if (!recResp.ok) {
    const text = await recResp.text()
    console.error('full recording fetch failed', recResp.status, text)
    return NextResponse.json({ error: 'Recording not found' }, { status: 200 })
  }

  const [rec] = await recResp.json()
  if (!rec) {
    return NextResponse.json({ error: 'Recording not found' }, { status: 200 })
  }

  const transcriptId: string | undefined = rec.aai_transcript_id

  if (!transcriptId) {
    return NextResponse.json(
      { error: 'No transcript id stored for this recording' },
      { status: 200 },
    )
  }

  // 2) Fetch transcript from AssemblyAI
  const aaiResp = await fetch(
    `https://api.assemblyai.com/v2/transcript/${encodeURIComponent(
      transcriptId,
    )}`,
    {
      headers: { Authorization: aaiKey },
    },
  )

  if (!aaiResp.ok) {
    const text = await aaiResp.text()
    console.error('AssemblyAI get transcript failed', aaiResp.status, text)
    return NextResponse.json(
      { error: 'Failed to load transcript' },
      { status: 200 },
    )
  }

  const aaiJson = await aaiResp.json()
  const transcriptText: string = aaiJson.text ?? ''

  // 3) Optional: Gemini summary
  let summary: string | undefined

  if (geminiKey && transcriptText) {
    try {
      const body = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  'Summarize this meeting transcript in a few sentences, plain text only:\n\n' +
                  transcriptText,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }

      const gResp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
          encodeURIComponent(geminiKey),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )

      if (gResp.ok) {
        const gJson = await gResp.json()
        summary = gJson.candidates?.[0]?.content?.parts?.[0]?.text ?? undefined
      }
    } catch (e) {
      console.error('Gemini summary error', e)
    }
  }

  return NextResponse.json(
    {
      title: (rec.title as string | null) ?? 'Recording',
      transcriptText,
      summary,
    },
    { status: 200 },
  )
}

