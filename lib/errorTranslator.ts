
export const translateSupabaseError = (errorMsg: string): string => {
  if (!errorMsg) return 'Erro desconhecido';

  const msg = errorMsg.toLowerCase();

  if (msg.includes('invalid login credentials')) return 'Email ou senha incorretos.';
  if (msg.includes('user not found')) return 'Usuário não encontrado.';
  if (msg.includes('user already registered')) return 'Este email já está cadastrado.';
  if (msg.includes('password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('email not confirmed')) return 'Por favor, confirme seu email.';
  if (msg.includes('rate limit exceeded')) return 'Muitas tentativas. Tente novamente mais tarde.';
  if (msg.includes('invalid input syntax for type uuid')) return 'Identificador inválido.';
  if (msg.includes('duplicate key value violates unique constraint')) return 'Este registro já existe.';
  if (msg.includes('network request failed')) return 'Erro de conexão. Verifique sua internet.';
  if (msg.includes('unexpected token')) return 'Erro de comunicação com o servidor.';
  
  // Genéricos
  if (msg.includes('fetch')) return 'Falha ao buscar dados.';
  if (msg.includes('insert')) return 'Falha ao salvar dados.';
  if (msg.includes('update')) return 'Falha ao atualizar dados.';
  if (msg.includes('delete')) return 'Falha ao excluir dados.';

  return errorMsg; // Retorna original se não tiver tradução específica
};
