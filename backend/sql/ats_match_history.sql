-- Apply once before deploying the ATS history endpoints.
-- Backend access is through the PostgreSQL application role, not browser roles.
CREATE TABLE IF NOT EXISTS public.ats_match_history (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    resume_id TEXT REFERENCES public.resume(id) ON DELETE CASCADE,
    job_description TEXT NOT NULL CHECK (char_length(job_description) <= 20000),
    result_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ats_match_history_user_created_idx
    ON public.ats_match_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ats_match_history_created_idx
    ON public.ats_match_history(created_at);

ALTER TABLE public.ats_match_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ats_match_history FROM PUBLIC;

DO $$
DECLARE role_name TEXT;
BEGIN
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
            EXECUTE format('REVOKE ALL ON TABLE public.ats_match_history FROM %I', role_name);
        END IF;
    END LOOP;
END
$$;
