-- Run this once in the Supabase SQL Editor before deploying the database-backed rate limiter.
-- The table is private to the backend database connection and is not exposed through the Supabase API.

CREATE TABLE IF NOT EXISTS public.rate_limit_bucket (
    id         VARCHAR(160) PRIMARY KEY,
    count      INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    reset_at   TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limit_bucket_reset_at_idx
    ON public.rate_limit_bucket (reset_at);

ALTER TABLE public.rate_limit_bucket ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.rate_limit_bucket FROM PUBLIC;
REVOKE ALL ON TABLE public.rate_limit_bucket FROM anon, authenticated, service_role;
GRANT ALL ON TABLE public.rate_limit_bucket TO postgres;
