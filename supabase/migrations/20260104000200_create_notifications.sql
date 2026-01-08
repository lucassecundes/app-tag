-- Create in_app_notifications table
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error')),
    target_version TEXT,
    condition TEXT NOT NULL DEFAULT 'all' CHECK (condition IN ('equal', 'less_than', 'all')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for active notifications"
    ON public.in_app_notifications
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin write access"
    ON public.in_app_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.usuario
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );
