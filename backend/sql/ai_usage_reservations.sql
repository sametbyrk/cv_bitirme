-- Apply once before deploying the AI quota reservation code.
CREATE TABLE IF NOT EXISTS public.ai_usage_reservation (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL CHECK (status IN ('reserved', 'consumed', 'released')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ai_usage_reservation_active_user_idx
    ON public.ai_usage_reservation(user_id, expires_at) WHERE status='reserved';
CREATE INDEX IF NOT EXISTS ai_usage_reservation_consumed_window_idx
    ON public.ai_usage_reservation(user_id, completed_at) WHERE status='consumed';
ALTER TABLE public.ai_usage_reservation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_usage_reservation FROM PUBLIC;

-- Supabase roles do not exist on a plain PostgreSQL server; revoke them only when present.
DO $$
DECLARE role_name TEXT;
BEGIN
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
            EXECUTE format('REVOKE ALL ON TABLE public.ai_usage_reservation FROM %I', role_name);
        END IF;
    END LOOP;
END
$$;
