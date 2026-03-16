import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local so we can use the same keys as the app
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const aaiKey = process.env.ASSEMBLYAI_API_KEY

if (!supabaseUrl || !serviceKey || !aaiKey) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ASSEMBLYAI_API_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})

async function fetchTranscriptDuration(transcriptId) {
  const resp = await fetch(`https://api.assemblyai.com/v2/transcript/${encodeURIComponent(transcriptId)}`, {
    method: 'GET',
    headers: {
      Authorization: aaiKey,
    },
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error(`AssemblyAI fetch failed for ${transcriptId}:`, resp.status, text)
    return null
  }

  const json = await resp.json()

  // AssemblyAI returns audio_duration in seconds
  if (typeof json.audio_duration === 'number') {
    return json.audio_duration
  }

  // Fallback: if we have words, infer from last end time (ms -> s)
  if (Array.isArray(json.words) && json.words.length > 0 && typeof json.words[json.words.length - 1].end === 'number') {
    return json.words[json.words.length - 1].end / 1000
  }

  return null
}

async function main() {
  console.log('Starting backfill of duration_seconds from AssemblyAI…')

  let processed = 0
  let updated = 0
  let skipped = 0
  let totalSeconds = 0

  const pageSize = 50
  let from = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from('recordings')
      .select('id, aai_transcript_id, duration_seconds')
      .is('duration_seconds', null)
      .not('aai_transcript_id', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('Error fetching recordings:', error)
      break
    }

    if (!data || data.length === 0) {
      break
    }

    for (const row of data) {
      processed += 1
      const transcriptId = row.aai_transcript_id
      if (!transcriptId) {
        skipped += 1
        continue
      }

      try {
        const duration = await fetchTranscriptDuration(transcriptId)
        if (!duration || !Number.isFinite(duration) || duration <= 0) {
          skipped += 1
          continue
        }

        const { error: updateError } = await supabase
          .from('recordings')
          .update({ duration_seconds: duration })
          .eq('id', row.id)

        if (updateError) {
          console.error(`Failed to update recording ${row.id}:`, updateError.message ?? updateError)
          skipped += 1
          continue
        }

        updated += 1
        totalSeconds += duration
      } catch (e) {
        console.error(`Exception processing recording ${row.id}:`, e)
        skipped += 1
      }
    }

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  console.log('Backfill complete.')
  console.log('Processed recordings:', processed)
  console.log('Updated   recordings:', updated)
  console.log('Skipped   recordings:', skipped)
  console.log('Total seconds (newly counted):', totalSeconds)
  console.log('Total hours  (newly counted):', (totalSeconds / 3600).toFixed(2), 'h')
}

main().catch((err) => {
  console.error('Fatal error in backfill script:', err)
  process.exit(1)
})

