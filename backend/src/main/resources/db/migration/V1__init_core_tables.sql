-- Fresh schema for PostgreSQL + PGVector (new database)
-- Includes all core tables and a normalized rag_chunks structure aligned with the data-pipeline.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1) app_users
CREATE TABLE IF NOT EXISTS app_users (
    id                BIGSERIAL PRIMARY KEY,
    username          TEXT NOT NULL UNIQUE,
    display_name      TEXT,
    email             TEXT UNIQUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) documents
CREATE TABLE IF NOT EXISTS documents (
    id                BIGSERIAL PRIMARY KEY,
    source_file       TEXT NOT NULL UNIQUE,
    title             TEXT,
    language          TEXT DEFAULT 'vi',
    total_pages       INTEGER,
    checksum_sha256   TEXT,
    metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) rag_chunks (normalized)
-- Keying: (document_id, chunk_index)
CREATE TABLE IF NOT EXISTS rag_chunks (
    id               BIGSERIAL PRIMARY KEY,

    -- Natural key
    document_id      BIGINT NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
    chunk_index      INTEGER NOT NULL,

    page_start       INTEGER NOT NULL,
    page_end         INTEGER NOT NULL,
    word_count       INTEGER,

    content          TEXT NOT NULL,
    page_spans_json  JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,

    embedding        VECTOR(1024) NOT NULL,
    chunk_tsv        tsvector NOT NULL,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (document_id, chunk_index)
);

-- 4) chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    title             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id                BIGSERIAL PRIMARY KEY,
    session_id        BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role              TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content           TEXT NOT NULL,
    model_name        TEXT,
    prompt_tokens     INTEGER,
    completion_tokens INTEGER,
    latency_ms        INTEGER,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT REFERENCES app_users(id) ON DELETE CASCADE,
    chunk_id          BIGINT REFERENCES rag_chunks(id) ON DELETE SET NULL,
    question          TEXT NOT NULL,
    answer            TEXT NOT NULL,
    difficulty        SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
    tags              TEXT[],
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) answer_citations
CREATE TABLE IF NOT EXISTS answer_citations (
    id                BIGSERIAL PRIMARY KEY,
    assistant_msg_id  BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    chunk_id          BIGINT NOT NULL REFERENCES rag_chunks(id) ON DELETE CASCADE,
    citation_order    INTEGER NOT NULL,
    quote_text        TEXT,
    start_char        INTEGER,
    end_char          INTEGER
);

-- 8) message_feedback
CREATE TABLE IF NOT EXISTS message_feedback (
    id                BIGSERIAL PRIMARY KEY,
    message_id        BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    rating            SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
    reason            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (message_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_source_file       ON documents(source_file);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id      ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tsv              ON rag_chunks USING GIN (chunk_tsv);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user          ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time  ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_user             ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_citations_msg        ON answer_citations(assistant_msg_id);

-- Optional vector index (HNSW, cosine)
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_hnsw
    ON rag_chunks USING hnsw (embedding vector_cosine_ops);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- rag_chunks.chunk_tsv trigger function (cannot be GENERATED because unaccent() is not IMMUTABLE)
CREATE OR REPLACE FUNCTION rag_chunks_set_chunk_tsv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.chunk_tsv := to_tsvector('simple', unaccent(coalesce(NEW.content, '')));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_rag_chunks_chunk_tsv ON rag_chunks;
CREATE TRIGGER trg_rag_chunks_chunk_tsv
BEFORE INSERT OR UPDATE OF content ON rag_chunks
FOR EACH ROW EXECUTE FUNCTION rag_chunks_set_chunk_tsv();

DROP TRIGGER IF EXISTS trg_rag_chunks_updated_at ON rag_chunks;
CREATE TRIGGER trg_rag_chunks_updated_at
BEFORE UPDATE ON rag_chunks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at
BEFORE UPDATE ON chat_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_flashcards_updated_at ON flashcards;
CREATE TRIGGER trg_flashcards_updated_at
BEFORE UPDATE ON flashcards
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
