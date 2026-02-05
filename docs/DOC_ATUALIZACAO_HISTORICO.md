# Documentação de Atualização: Sistema de Histórico (Web & Backend)

Este documento resume as melhorias implementadas no sistema de histórico de TAGs para garantir consistência entre as plataformas Web e Mobile, além de resolver problemas de visibilidade para usuários administradores.

## 1. Visibilidade e Segurança (RLS)
Para que usuários com a role `admin` possam visualizar o histórico de qualquer TAG (mesmo as que não lhes pertencem diretamente), foram criadas novas políticas de Row Level Security (RLS).

**Ações realizadas:**
- Criação de políticas que verificam a role do usuário na tabela `public.usuario` antes de permitir o `SELECT` na tabela `historico_tags`.
- **Impacto no App Nativo:** Nenhum. O app nativo continuará acessando os dados normalmente através de suas próprias permissões de usuário comum.

## 2. Consistência de Dados (data_hora vs created_at)
Identificamos que alguns registros antigos ou gerados por versões anteriores não possuíam o campo `data_hora` preenchido, o que causava falhas na ordenação e filtros da versão Web.

**Melhoria implementada:**
- **Lógica de Fallback:** O frontend agora utiliza o campo `created_at` (gerado automaticamente pelo Supabase) como substituto imediato caso o `data_hora` esteja nulo.
- **Ordenação Inteligente:** As consultas ao banco agora tentam ordenar por `data_hora` decrescente, mas possuem um mecanismo de captura de erro que alterna para `created_at` se necessário.

## 3. Padronização de Novos Registros
Para garantir que o campo `data_hora` seja sempre preenchido daqui em diante, as seguintes camadas foram atualizadas:

- **Edge Functions:** A função `reportar-localizacao` foi atualizada para enviar explicitamente o timestamp no campo `data_hora` durante o `INSERT`.
- **Frontend Web:** O método `updateTagLocation` no hook `useSupabase` também foi padronizado para preencher este campo.

## 4. Recomendações para o App Nativo
Para manter a paridade total entre as plataformas, sugere-se que o App Nativo adote as seguintes práticas (caso ainda não o faça):

1.  **Envio de data_hora:** Ao inserir novos pontos na tabela `historico_tags`, certifique-se de enviar o timestamp atual no formato ISO no campo `data_hora`.
2.  **Fallback de Exibição:** Na listagem de histórico do app, utilize uma lógica similar ao web: `exibir_data = registro.data_hora ?? registro.created_at`.

## 5. Integridade do Banco de Dados
**Importante:** Nenhuma alteração estrutural (como mudança de tipos de colunas ou adição de novos campos) foi realizada na tabela `historico_tags`. A tabela permanece exatamente como definida originalmente, garantindo que o App Nativo não sofra interrupções ou erros de esquema.

---
*Documento gerado em 02/02/2026 para alinhamento de equipes de desenvolvimento.*
