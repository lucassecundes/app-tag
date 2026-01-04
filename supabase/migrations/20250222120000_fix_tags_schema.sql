/*
# Correção do Schema de Tags e Histórico

1. Alterações na Tabela `tags`:
   - Garante a criação da tabela se não existir.
   - Adiciona a coluna `created_at` (causa do erro relatado).
   - Adiciona colunas essenciais: `nome`, `codigo`, `type`, `usuario_id`, `ultima_lat`, `ultima_lng`, `endereco`.
   - Configura chaves estrangeiras para `auth.users`.

2. Alterações na Tabela `historico_tags`:
   - Cria a tabela para armazenar o histórico de posições.
   - Vincula com a tabela `tags`.

3. Segurança (RLS):
   - Habilita Row Level Security (RLS).
   - Cria políticas para que usuários só acessem seus próprios dispositivos.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true
*/

-- Criar a tabela 'tags' se não existir
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT,
    codigo TEXT,
    type TEXT DEFAULT 'car',
    ultima_lat DOUBLE PRECISION,
    ultima_lng DOUBLE PRECISION,
    endereco TEXT,
    ultima_comunicacao TIMESTAMPTZ
);

-- Garantir que a coluna created_at existe (caso a tabela já existisse sem ela)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tags' AND column_name = 'created_at') THEN
        ALTER TABLE public.tags ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Habilitar RLS na tabela tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos e recriar
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

-- Criar políticas de segurança para tags
CREATE POLICY "Users can view their own tags" ON public.tags
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own tags" ON public.tags
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own tags" ON public.tags
    FOR DELETE USING (auth.uid() = usuario_id);


-- Criar a tabela 'historico_tags' se não existir
CREATE TABLE IF NOT EXISTS public.historico_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    endereco TEXT
);

-- Habilitar RLS na tabela historico_tags
ALTER TABLE public.historico_tags ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de histórico
DROP POLICY IF EXISTS "Users can view history of their tags" ON public.historico_tags;

-- Criar política para histórico (usuário vê histórico das tags que pertencem a ele)
CREATE POLICY "Users can view history of their tags" ON public.historico_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tags
            WHERE tags.id = historico_tags.tag_id
            AND tags.usuario_id = auth.uid()
        )
    );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tags_usuario_id ON public.tags(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_tags_tag_id ON public.historico_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_historico_tags_data_hora ON public.historico_tags(data_hora DESC);
