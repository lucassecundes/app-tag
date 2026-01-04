/*
  # Adicionar Colunas de Alerta na Tabela Tags
  
  ## Query Description:
  Adiciona colunas para suportar as funcionalidades de "Zona Segura" (Geofence) e "Alerta de Movimento".
  - alerta_cerca: Booleano para ativar/desativar a zona segura.
  - cerca_lat/lng: Coordenadas do centro da zona segura.
  - cerca_raio: Raio em metros (padrão 100m).
  - alerta_movimento: Booleano para ativar/desativar alerta de movimento (modo estacionamento).
  - movimento_lat/lng: Coordenadas de referência para o movimento.
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

ALTER TABLE public.tags
ADD COLUMN IF NOT EXISTS alerta_cerca BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cerca_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS cerca_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS cerca_raio INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS alerta_movimento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS movimento_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS movimento_lng DOUBLE PRECISION;
