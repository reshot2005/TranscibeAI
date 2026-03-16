import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Prefer .env.local (Next.js style) when running locally
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})

async function main() {
  console.log('Starting backfill of storage_bytes for recordings...')

  let processed = 0
  let updated = 0
  let skipped = 0
  let totalBytes = 0

  // We fetch in pages to avoid loading everything at once
  const pageSize = 100
  let from = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from('recordings')
      .select('id, original_storage_path, storage_bytes, storage_type')
      .is('storage_bytes', null)
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
      const path = row.original_storage_path
      if (!path) {
        skipped += 1
        continue
      }

      try {
        const { data: info, error: infoError } = await supabase.storage
          .from('recordings-original')
          .info(path)

        if (infoError) {
          console.error(`Failed to get info for ${path}:`, infoError.message ?? infoError)
          skipped += 1
          continue
        }

        const size = typeof info.size === 'number' ? info.size : Number(info.size ?? 0)
        if (!Number.isFinite(size) || size <= 0) {
          skipped += 1
          continue
        }

        const { error: updateError } = await supabase
          .from('recordings')
          .update({
            storage_type: row.storage_type || 'supabase',
            storage_bytes: size,
          })
          .eq('id', row.id)

        if (updateError) {
          console.error(`Failed to update recording ${row.id}:`, updateError.message ?? updateError)
          skipped += 1
          continue
        }

        updated += 1
        totalBytes += size
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
  console.log('Processed:', processed)
  console.log('Updated :', updated)
  console.log('Skipped :', skipped)
  console.log('Total bytes (newly counted):', totalBytes)
  console.log('Total MB (newly counted):', (totalBytes / (1024 * 1024)).toFixed(2), 'MB')
}

main().catch((err) => {
  console.error('Fatal error in backfill script:', err)
  process.exit(1)
})

