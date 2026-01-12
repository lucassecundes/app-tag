import OpenAI from 'openai';
import { supabase } from '../lib/supabase';
import { ChatService } from './chatService';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API Key missing. AI Chat will not function correctly.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true, // Needed for Expo/React Native
});

// Rate Limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10;
const requestTimestamps: Record<string, number[]> = {};

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  if (!requestTimestamps[userId]) {
    requestTimestamps[userId] = [];
  }
  
  // Filter out old timestamps
  requestTimestamps[userId] = requestTimestamps[userId].filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (requestTimestamps[userId].length >= MAX_REQUESTS) {
    return false;
  }
  
  requestTimestamps[userId].push(now);
  return true;
}

// Tools Definitions
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_user_devices',
      description: 'Get a list of all devices owned by the user, including their status and last communication.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_device_location',
      description: 'Get the current location (latitude, longitude, address) of a specific device by name or ID.',
      parameters: {
        type: 'object',
        properties: {
          deviceName: {
            type: 'string',
            description: 'The name or partial name of the device to find.',
          },
        },
        required: ['deviceName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_visited_places',
      description: 'Get a list of frequently visited addresses for the user.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of places to return (default 5).',
          },
        },
      },
    },
  },
];

// Tool Implementations
async function getUserDevices(userId: string) {
  console.log('AI Tool: getUserDevices for', userId);
  const { data, error } = await supabase
    .from('tags')
    .select('id, nome, icone, ultima_comunicacao, endereco')
    .eq('usuario_id', userId);

  if (error) {
    console.error('AI Tool Error (getUserDevices):', error);
    throw new Error(error.message);
  }
  console.log('AI Tool: Found', data?.length, 'devices');
  return JSON.stringify(data);
}

async function getDeviceLocation(userId: string, deviceName: string) {
  console.log('AI Tool: getDeviceLocation for', deviceName, 'user', userId);
  const { data, error } = await supabase
    .from('tags')
    .select('id, nome, ultima_lat, ultima_lng, endereco, ultima_comunicacao')
    .eq('usuario_id', userId)
    .ilike('nome', `%${deviceName}%`)
    .limit(1);

  if (error) {
    console.error('AI Tool Error (getDeviceLocation):', error);
    throw new Error(error.message);
  }
  if (!data || data.length === 0) return 'Dispositivo não encontrado.';
  return JSON.stringify(data[0]);
}

async function getVisitedPlaces(userId: string, limit = 5) {
  console.log('AI Tool: getVisitedPlaces for', userId, 'limit', limit);
  const { data, error } = await supabase
    .from('visited_addresses')
    .select('address, visit_count, last_visit')
    .eq('user_id', userId)
    .order('visit_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('AI Tool Error (getVisitedPlaces):', error);
    throw new Error(error.message);
  }
  console.log('AI Tool: Found', data?.length, 'visited places');
  return JSON.stringify(data);
}

export const AIService = {
  async sendMessage(messages: any[], userId: string) {
    try {
      if (!checkRateLimit(userId)) {
        return {
          role: 'assistant',
          content: 'Você atingiu o limite de mensagens por minuto. Por favor, aguarde um pouco.'
        };
      }

      if (!OPENAI_API_KEY) {
        return { 
          role: 'assistant', 
          content: 'Erro: Chave de API da OpenAI não configurada. Por favor, configure a variável EXPO_PUBLIC_OPENAI_API_KEY.' 
        };
      }

      // Fetch dynamic system prompt from Supabase
      const systemPrompt = await ChatService.getSystemPrompt();
      const defaultSystemPrompt = `Você é o assistente virtual inteligente do app Tag Nativo. 
          Sua função é ajudar o usuário a gerenciar seus dispositivos de rastreamento (tags).
          Você pode listar dispositivos, verificar localização atual e histórico de endereços.
          Sempre seja polido, conciso e direto. Responda em Português do Brasil.
          Se o usuário perguntar algo fora do contexto de rastreamento, gentilmente recuse e volte ao foco.`;

      // Add system prompt if not present
      const fullMessages = [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt
        },
        ...messages
      ];

      const runner = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: fullMessages,
        tools: tools as any,
        tool_choice: 'auto',
      });

      const message = runner.choices[0].message;

      // Handle Tool Calls
      if (message.tool_calls) {
        const toolMessages = [...fullMessages, message]; // Add assistant's tool call request

        for (const toolCall of message.tool_calls) {
          const functionName = (toolCall as any).function.name;
          const args = JSON.parse((toolCall as any).function.arguments);
          let toolResult = '';

          try {
            if (functionName === 'get_user_devices') {
              toolResult = await getUserDevices(userId);
            } else if (functionName === 'get_device_location') {
              toolResult = await getDeviceLocation(userId, args.deviceName);
            } else if (functionName === 'get_visited_places') {
              toolResult = await getVisitedPlaces(userId, args.limit);
            }
          } catch (e: any) {
            toolResult = `Error executing ${functionName}: ${e.message}`;
          }

          toolMessages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: toolResult,
          });
        }

        // Get final response after tool execution
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: toolMessages as any,
        });

        return finalResponse.choices[0].message;
      }

      return message;

    } catch (error: any) {
      console.error('AI Service Error:', error);
      return {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.'
      };
    }
  },
};
