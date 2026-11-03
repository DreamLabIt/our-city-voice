CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE post_embeddings (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemini-embedding-001',
  dimensions INTEGER NOT NULL DEFAULT 768,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX post_embeddings_embedding_idx ON post_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX post_embeddings_post_id_idx ON post_embeddings (post_id);
