-- Setup script for pgvector extension
-- Run this in your PostgreSQL database to enable vector operations
-- 
-- Usage:
--   psql -d your_database -f scripts/setup-pgvector.sql
--   Or run via Prisma: npx prisma db execute --file scripts/setup-pgvector.sql

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to editor_prompt_history table if it doesn't exist
-- Note: Prisma doesn't support pgvector types directly, so we use raw SQL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'editor_prompt_history' 
    AND column_name = 'embedding'
  ) THEN
    ALTER TABLE editor_prompt_history 
    ADD COLUMN embedding vector(1536);
    
    -- Create index for efficient similarity search
    CREATE INDEX IF NOT EXISTS editor_prompt_history_embedding_idx 
    ON editor_prompt_history 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  END IF;
END $$;

-- Verify the extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

