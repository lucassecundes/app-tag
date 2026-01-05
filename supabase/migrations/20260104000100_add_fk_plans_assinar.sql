-- Add FK to plans_assinar referencing planos
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'plans_assinar_plan_id_fkey'
  ) THEN 
    ALTER TABLE public.plans_assinar 
    ADD CONSTRAINT plans_assinar_plan_id_fkey 
    FOREIGN KEY (plan_id) 
    REFERENCES public.planos(id);
  END IF; 
END $$;
