ALTER TABLE flashcards
    DROP COLUMN IF EXISTS chunk_id,
    DROP COLUMN IF EXISTS difficulty,
    DROP COLUMN IF EXISTS tags;
