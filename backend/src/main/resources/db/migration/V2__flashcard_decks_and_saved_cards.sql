CREATE TABLE IF NOT EXISTS flashcard_decks (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    topic        TEXT NOT NULL DEFAULT 'Lịch sử Việt Nam',
    description  TEXT,
    color        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE flashcards
    ADD COLUMN IF NOT EXISTS deck_id BIGINT REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS source_conversation_id BIGINT REFERENCES conversations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS source_message_id BIGINT REFERENCES chat_messages(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'flashcards_status_check'
    ) THEN
        ALTER TABLE flashcards
            ADD CONSTRAINT flashcards_status_check
            CHECK (status IN ('new', 'learning', 'mastered'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'flashcards_source_check'
    ) THEN
        ALTER TABLE flashcards
            ADD CONSTRAINT flashcards_source_check
            CHECK (source IN ('manual', 'suggested', 'conversation_rule'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_source_conversation ON flashcards(source_conversation_id);

DROP TRIGGER IF EXISTS trg_flashcard_decks_updated_at ON flashcard_decks;
CREATE TRIGGER trg_flashcard_decks_updated_at
BEFORE UPDATE ON flashcard_decks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
