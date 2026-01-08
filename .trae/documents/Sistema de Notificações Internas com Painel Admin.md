# Implementação de Notificações Internas e Painel Admin

## 1. Banco de Dados (Supabase)
Criar a tabela `in_app_notifications` para armazenar os comunicados:
- `id`: UUID (PK)
- `title`: Texto (Título da notificação)
- `message`: Texto (Conteúdo)
- `type`: Texto (info, warning, error)
- `target_version`: Texto (Versão alvo, ex: "1.0.0")
- `condition`: Texto (equal, less_than, all) - Regra de comparação
- `is_active`: Booleano
- `created_at`: Timestamp

## 2. Componente de Notificação (Frontend)
Criar `components/NotificationBanner.tsx`:
- Busca notificações ativas no Supabase.
- Compara a versão do app (obtida via `expo-constants` ou `package.json`) com `target_version` usando a regra `condition`.
- Exibe um banner no topo da tela se houver correspondência.
- Permite fechar a notificação (opcionalmente salvar localmente que foi lida).

## 3. Integração Global
- Inserir o `NotificationBanner` no layout principal (`app/_layout.tsx` ou `app/(tabs)/_layout.tsx`) para garantir que apareça em todas as telas autenticadas.

## 4. Painel de Administrador
Atualizar a tela de Perfil (`app/(tabs)/profile.tsx`):
- Verificar se o usuário possui `role: 'admin'`.
- Se sim, exibir nova opção no menu: "Gerenciar Notificações".

Criar nova tela `app/admin/notifications.tsx`:
- Listar notificações existentes.
- Formulário para criar nova notificação:
  - Título e Mensagem.
  - Seletor de Tipo (Info/Alerta/Erro).
  - Campo para versão alvo (ex: 1.0.0).
  - Regra: "Apenas para esta versão", "Versões anteriores a esta", "Todas as versões".
