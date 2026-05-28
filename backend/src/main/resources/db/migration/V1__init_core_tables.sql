-- Fresh schema for PostgreSQL + PGVector (new database)
-- Final schema (users + auth + conversations + RAG tables)

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1) users (common user profile)
CREATE TABLE IF NOT EXISTS users (
    id                BIGSERIAL PRIMARY KEY,
    username          TEXT UNIQUE,
    display_name      TEXT,
    email             TEXT UNIQUE,
    avatar_url        TEXT,
    email_verified    BOOLEAN NOT NULL DEFAULT false,
    status            TEXT NOT NULL DEFAULT 'active',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at     TIMESTAMPTZ
);

-- 2) local_credentials (email/password login)
CREATE TABLE IF NOT EXISTS local_credentials (
    user_id             BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash       TEXT NOT NULL,
    password_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) user_identities (Google login link; extensible later)
CREATE TABLE IF NOT EXISTS user_identities (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider           TEXT NOT NULL CHECK (provider IN ('google')),
    provider_subject   TEXT NOT NULL,
    email_at_link_time TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at      TIMESTAMPTZ,
    UNIQUE (provider, provider_subject),
    UNIQUE (user_id, provider)
);

-- 4) refresh_tokens (long-lived login sessions, supports logout/revoke)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    user_agent   TEXT,
    ip_hash      TEXT,
    UNIQUE (token_hash)
);

-- 5) documents
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

-- 6) rag_chunks (normalized)
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

-- 7) conversations
CREATE TABLE IF NOT EXISTS conversations (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT REFERENCES users(id) ON DELETE SET NULL,
    title             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8) chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id                BIGSERIAL PRIMARY KEY,
    conversation_id   BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role              TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content           TEXT NOT NULL,
    model_name        TEXT,
    prompt_tokens     INTEGER,
    completion_tokens INTEGER,
    latency_ms        INTEGER,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9) flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT REFERENCES users(id) ON DELETE CASCADE,
    chunk_id          BIGINT REFERENCES rag_chunks(id) ON DELETE SET NULL,
    question          TEXT NOT NULL,
    answer            TEXT NOT NULL,
    difficulty        SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
    tags              TEXT[],
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10) answer_citations
CREATE TABLE IF NOT EXISTS answer_citations (
    id                BIGSERIAL PRIMARY KEY,
    assistant_msg_id  BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    chunk_id          BIGINT NOT NULL REFERENCES rag_chunks(id) ON DELETE CASCADE,
    citation_order    INTEGER NOT NULL,
    quote_text        TEXT,
    start_char        INTEGER,
    end_char          INTEGER
);

-- 11) message_feedback
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
CREATE INDEX IF NOT EXISTS idx_user_identities_user        ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_expires ON refresh_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires      ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user          ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_time  ON chat_messages(conversation_id, created_at);
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

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_local_credentials_updated_at ON local_credentials;
CREATE TRIGGER trg_local_credentials_updated_at
BEFORE UPDATE ON local_credentials
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_rag_chunks_chunk_tsv ON rag_chunks;
CREATE TRIGGER trg_rag_chunks_chunk_tsv
BEFORE INSERT OR UPDATE OF content ON rag_chunks
FOR EACH ROW EXECUTE FUNCTION rag_chunks_set_chunk_tsv();

DROP TRIGGER IF EXISTS trg_rag_chunks_updated_at ON rag_chunks;
CREATE TRIGGER trg_rag_chunks_updated_at
BEFORE UPDATE ON rag_chunks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_flashcards_updated_at ON flashcards;
CREATE TRIGGER trg_flashcards_updated_at
BEFORE UPDATE ON flashcards
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
