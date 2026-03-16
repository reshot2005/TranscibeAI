-- VoiceVault AI core schema for Supabase/Postgres

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "vector";

-- Teams & users are assumed to exist in your auth schema.

-- Recordings: one per uploaded or live session
create table if not exists public.recordings (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null,
  user_id uuid not null,
  title text,
  original_storage_path text not null,
  processed_storage_path text,
  -- Where the original media is stored: 'supabase' or 'cloudinary'
  storage_type text,
  -- Size of the stored media in bytes (tracked only for Supabase-backed objects)
  storage_bytes bigint,
  status text default 'uploaded',
  transcription_status text default 'pending',
  diarization_status text default 'pending',
  analysis_status text default 'pending',
  snr numeric,
  vad_speech_map jsonb,
  validation_metadata jsonb,
  preprocessing_metadata jsonb,
  chunking_metadata jsonb,
  estimated_accuracy numeric,
  failure_reason text,
  -- Optional association to department / team member / folder
  department_id uuid,
  team_member_id uuid,
  duration_seconds numeric,
  aai_transcript_id text,
  folder_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists recordings_team_created_idx
  on public.recordings (team_id, created_at desc);

-- Transcription jobs / queue
create table if not exists public.transcription_jobs (
  id bigserial primary key,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  team_id uuid not null,
  user_id uuid not null,
  status text default 'queued',
  priority text default 'normal',
  attempts int default 0,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists transcription_jobs_status_priority_idx
  on public.transcription_jobs (status, priority, created_at);

-- Secondary engine transcripts (Groq Whisper, Google STT segments, etc.)
create table if not exists public.secondary_transcripts (
  id bigserial primary key,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  engine text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

create index if not exists secondary_transcripts_recording_engine_idx
  on public.secondary_transcripts (recording_id, engine, created_at desc);

-- Team-specific vocabulary for boosting domain terms
create table if not exists public.team_vocab (
  id bigserial primary key,
  team_id uuid not null,
  term text not null,
  created_at timestamptz default now()
);

create unique index if not exists team_vocab_team_term_unique
  on public.team_vocab (team_id, term);

-- Merged transcript segments (post-arbitration, pre/post-diarization)
create table if not exists public.transcript_segments (
  id bigserial primary key,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  index int not null,
  speaker text default 'UNKNOWN',
  start_ms int not null,
  end_ms int not null,
  text text not null,
  confidence numeric,
  source text,
  low_confidence boolean default false
);

create index if not exists transcript_segments_recording_start_idx
  on public.transcript_segments (recording_id, start_ms);

-- Diarization segments from PyAnnote
create table if not exists public.diarization_segments (
  id bigserial primary key,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  speaker_label text not null,
  start_sec numeric not null,
  end_sec numeric not null
);

create index if not exists diarization_segments_recording_start_idx
  on public.diarization_segments (recording_id, start_sec);

-- Speaker embeddings (pgvector)
create table if not exists public.speaker_embeddings (
  id bigserial primary key,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  speaker_label text not null,
  start_sec numeric not null,
  end_sec numeric not null,
  embedding vector(192) not null
);

create index if not exists speaker_embeddings_recording_idx
  on public.speaker_embeddings (recording_id);

-- Meeting-level analysis (summary, entities, analytics JSON)
create table if not exists public.meeting_analysis (
  id bigserial primary key,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  summary jsonb,
  entities jsonb,
  analytics jsonb,
  created_at timestamptz default now()
);

-- Semantic search embeddings (OpenAI text-embedding-3-small)
create table if not exists public.transcript_embeddings (
  id bigserial primary key,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  chunk_index int not null,
  text text not null,
  embedding vector(1536) not null
);

create index if not exists transcript_embeddings_recording_idx
  on public.transcript_embeddings (recording_id);

create index if not exists transcript_embeddings_vector_idx
  on public.transcript_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Custom corrections & vocabulary learning
create table if not exists public.custom_corrections (
  id bigserial primary key,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  user_id uuid not null,
  original_text text not null,
  corrected_text text not null,
  start_ms int,
  end_ms int,
  created_at timestamptz default now()
);

-- Recording folders per team member (manual grouping like "All recordings of March 3")
create table if not exists public.recording_folders (
  id uuid primary key default uuid_generate_v4(),
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create index if not exists recording_folders_member_idx
  on public.recording_folders (team_member_id, created_at);


-- Full-text index on transcript text for hybrid search
create index if not exists transcript_segments_fts_idx
  on public.transcript_segments
  using gin (to_tsvector('english', text));

