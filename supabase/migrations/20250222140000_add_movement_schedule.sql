ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS movimento_hora_inicio text,
ADD COLUMN IF NOT EXISTS movimento_hora_fim text;
