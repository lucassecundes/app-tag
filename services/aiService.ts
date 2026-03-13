/**
 * aiService.ts
 *
 * Integração com o assistente de IA via Supabase Edge Function.
 * A chave da OpenAI NÃO fica mais no client — ela fica como secret
 * no servidor (Edge Function `ai-chat`).
 *
 * Proteções mantidas no client:
 *  - Validação de comprimento de mensagem
 *  - Detecção básica de Prompt Injection antes de enviar
 *  - Rate limit local (evita chamadas redundantes)
 */

import { supabase } from '../lib/supabase';

// --- Rate Limiting local (primeira barreira, a Edge Function tem outra) ---
const RATE_LIMIT_WINDOW = 60_000; // 1 minuto
const MAX_REQUESTS = 10;
const requestTimestamps: Record<string, number[]> = {};

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  if (!requestTimestamps[userId]) requestTimestamps[userId] = [];
  requestTimestamps[userId] = requestTimestamps[userId].filter(
    (t) => now - t < RATE_LIMIT_WINDOW
  );
  if (requestTimestamps[userId].length >= MAX_REQUESTS) return false;
  requestTimestamps[userId].push(now);
  return true;
}

// --- Detecção de Prompt Injection (client-side, primeira barreira) ---
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /forget\s+(all\s+)?previous/i,
  /you\s+are\s+now/i,
  /new\s+instructions?\s*:/i,
  /system\s*:/i,
  /\[INST\]/i,
  /ignore\s+as\s+instru[çc][oõ]es/i,
  /esqueça\s+(tudo|as\s+instru)/i,
  /ignore\s+as\s+regras/i,
  /você\s+agora\s+é/i,
  /act\s+as\s+(if\s+you\s+are|a|an)\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
];

const MAX_MESSAGE_LENGTH = 600;

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

export const AIService = {
  async sendMessage(
    messages: Array<{ role: string; content: string }>,
    _userId: string // mantido por compatibilidade, mas userId real vem do JWT
  ) {
    // Validação local da última mensagem do usuário
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      if (lastUserMsg.content.length > MAX_MESSAGE_LENGTH) {
        return {
          role: 'assistant',
          content: 'Por favor, envie mensagens mais curtas (máximo 600 caracteres).',
        };
      }
      if (detectInjection(lastUserMsg.content)) {
        return {
          role: 'assistant',
          content:
            'Sua mensagem contém conteúdo não permitido. Sou um assistente de rastreamento e só posso ajudar com informações sobre seus dispositivos.',
        };
      }
    }

    // Rate limit local
    if (!checkRateLimit(_userId)) {
      return {
        role: 'assistant',
        content: 'Você atingiu o limite de mensagens por minuto. Por favor, aguarde um pouco.',
      };
    }

    // Envia para a Edge Function (a chave OpenAI fica segura no servidor)
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { messages },
    });

    if (error) {
      console.error('AIService: Edge Function error:', error);
      throw new Error(error.message || 'Erro ao conectar com o assistente.');
    }

    return data;
  },
};
