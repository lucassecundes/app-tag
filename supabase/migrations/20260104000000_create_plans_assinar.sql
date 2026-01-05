-- Create plans_assinar table
CREATE TABLE IF NOT EXISTS public.plans_assinar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL,
    activation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiration_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.plans_assinar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans"
    ON public.plans_assinar
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
    ON public.plans_assinar
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create activate_device function
CREATE OR REPLACE FUNCTION public.activate_device(
    p_user_id UUID,
    p_device_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_plan RECORD;
    v_new_plan RECORD;
    v_plan_id UUID := 'e264dc25-efa9-4530-8e62-dd0563394313';
BEGIN
    -- Verify if user owns the device
    IF NOT EXISTS (SELECT 1 FROM public.tags WHERE id = p_device_id AND usuario_id = p_user_id) THEN
        RAISE EXCEPTION 'Device does not belong to user';
    END IF;

    -- Check for existing active plan
    SELECT * INTO v_existing_plan
    FROM public.plans_assinar
    WHERE device_id = p_device_id
    AND status = 'active'
    AND expiration_date > NOW();

    IF FOUND THEN
        RAISE EXCEPTION 'Device already has an active plan';
    END IF;

    -- Create new plan
    INSERT INTO public.plans_assinar (
        user_id,
        device_id,
        plan_id,
        activation_date,
        expiration_date,
        status
    ) VALUES (
        p_user_id,
        p_device_id,
        v_plan_id,
        NOW(),
        NOW() + INTERVAL '1 year',
        'active'
    )
    RETURNING * INTO v_new_plan;

    -- Return the created plan as JSON
    RETURN to_jsonb(v_new_plan);
END;
$$;
